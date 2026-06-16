/**
 * xhs_collector.js
 * 小红书创作服务平台账号 API 数据采集器
 *
 * 用途：
 * - 在用户已登录 creator.xiaohongshu.com 的本地浏览器页面中运行
 * - 被动监听页面加载出的目标数据接口
 * - 或主动低频请求 6 个只读数据接口
 * - 下载 Response JSON 文件，用于账号诊断
 *
 * 安全说明：
 * - 不读取 Cookie
 * - 不导出 Cookie
 * - 不读取 Request Headers
 * - 不上传任何数据到外部服务器
 * - 只请求 creator.xiaohongshu.com 同源只读数据接口
 * - 不做点赞、收藏、评论、关注、发布等写操作
 */

(() => {
  const ORIGIN = 'https://creator.xiaohongshu.com';

  const TARGETS = [
    {
      key: 'note_detail_new',
      name: '笔记数据总览',
      path: '/api/galaxy/creator/data/note_detail_new',
      required: true
    },
    {
      key: 'note_analyze_list',
      name: '单篇笔记分析列表',
      path: '/api/galaxy/creator/datacenter/note/analyze/list?type=0&page_size=10&page_num=1',
      match: '/api/galaxy/creator/datacenter/note/analyze/list',
      required: true
    },
    {
      key: 'fans_overall_new',
      name: '粉丝增长总览',
      path: '/api/galaxy/creator/data/fans/overall_new',
      required: true
    },
    {
      key: 'active_fans_new',
      name: '活跃粉丝列表',
      path: '/api/galaxy/creator/data/active_fans_new',
      required: true
    },
    {
      key: 'audience_view_periods',
      name: '观看时段分布',
      path: '/api/galaxy/v2/creator/datacenter/audience/view/periods',
      required: true
    },
    {
      key: 'audience_source_account',
      name: '账号流量来源',
      path: '/api/galaxy/v2/creator/datacenter/audience/source/account',
      required: true
    }
  ];

  const OPTIONAL_TARGETS = [
    {
      key: 'live_overview',
      name: '直播数据总览',
      path: '/api/galaxy/v2/creator/datacenter/livedata/overview',
      required: false
    },
    {
      key: 'permission_query',
      name: '数据中心权限',
      path: '/api/galaxy/creator/datacenter/permission/query',
      required: false
    }
  ];

  const ALL_TARGETS = [...TARGETS, ...OPTIONAL_TARGETS];

  const state = {
    installed_at: new Date().toISOString(),
    items: [],
    errors: []
  };

  function normalizeUrl(url) {
    if (!url) return '';
    try {
      return new URL(String(url), location.origin).href;
    } catch (e) {
      return String(url);
    }
  }

  function getTargetByUrl(url) {
    const full = normalizeUrl(url);
    return ALL_TARGETS.find(t => {
      const marker = t.match || t.path;
      return full.includes(marker);
    });
  }

  function shouldCapture(url) {
    const full = normalizeUrl(url);
    return full.includes('creator.xiaohongshu.com') && Boolean(getTargetByUrl(full));
  }

  function parseText(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  function upsertItem(item) {
    const index = state.items.findIndex(x => x.key === item.key);
    if (index >= 0) {
      state.items[index] = item;
    } else {
      state.items.push(item);
    }
  }

  function capture(url, text, meta = {}) {
    const target = getTargetByUrl(url);
    if (!target) return;

    const item = {
      key: target.key,
      name: target.name,
      request_url: normalizeUrl(url),
      captured_at: new Date().toISOString(),
      source: meta.source || 'unknown',
      status: meta.status ?? null,
      ok: meta.ok ?? null,
      response: parseText(text)
    };

    upsertItem(item);
    console.log(`[XHS Collector] 已采集：${target.name}`, item.request_url);
  }

  async function collectOne(target) {
    const url = ORIGIN + target.path;
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      const text = await response.text();

      capture(url, text, {
        source: 'active_fetch',
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        state.errors.push({
          key: target.key,
          url,
          status: response.status,
          message: `HTTP ${response.status}`
        });
      }

      return response.ok;
    } catch (error) {
      state.errors.push({
        key: target.key,
        url,
        message: error?.message || String(error)
      });
      console.warn(`[XHS Collector] 采集失败：${target.name}`, error);
      return false;
    }
  }

  async function collectNow(options = {}) {
    const includeOptional = Boolean(options.includeOptional);
    const targets = includeOptional ? ALL_TARGETS : TARGETS;

    console.log(`[XHS Collector] 开始主动采集 ${targets.length} 个接口。`);

    for (const target of targets) {
      await collectOne(target);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    summary();
    return state.items;
  }

  function installPassiveCapture() {
    if (window.__xhsCollectorPassiveInstalled) {
      console.log('[XHS Collector] 被动监听已安装，无需重复安装。');
      return;
    }

    window.__xhsCollectorPassiveInstalled = true;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const url = args[0] instanceof Request ? args[0].url : String(args[0]);
        if (shouldCapture(url)) {
          response.clone().text().then(text => {
            capture(url, text, {
              source: 'passive_fetch',
              status: response.status,
              ok: response.ok
            });
          });
        }
      } catch (e) {}

      return response;
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this.__xhsCollectorUrl = url;
      return originalOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('load', function() {
        try {
          const url = this.responseURL || this.__xhsCollectorUrl;
          if (shouldCapture(url)) {
            capture(url, this.responseText, {
              source: 'passive_xhr',
              status: this.status,
              ok: this.status >= 200 && this.status < 300
            });
          }
        } catch (e) {}
      });

      return originalSend.apply(this, args);
    };

    console.log('[XHS Collector] 被动监听已安装。请点击数据看板、笔记分析、粉丝数据、账号概览等页面。');
  }

  function list() {
    const rows = state.items.map((item, index) => ({
      index: index + 1,
      key: item.key,
      name: item.name,
      status: item.status,
      source: item.source,
      captured_at: item.captured_at,
      url: item.request_url
    }));
    console.table(rows);
    return state.items;
  }

  function summary() {
    const collectedKeys = new Set(state.items.map(x => x.key));
    const required = TARGETS.map(t => ({
      key: t.key,
      name: t.name,
      collected: collectedKeys.has(t.key)
    }));

    const missing = required.filter(x => !x.collected);

    console.table(required);

    if (missing.length) {
      console.warn('[XHS Collector] 缺少接口：', missing.map(x => x.name).join('、'));
    } else {
      console.log('[XHS Collector] 6 个核心接口已采集齐全。');
    }

    if (state.errors.length) {
      console.warn('[XHS Collector] 采集过程中出现错误：', state.errors);
    }

    return {
      total: state.items.length,
      required,
      missing,
      errors: state.errors
    };
  }

  function clear() {
    state.items.length = 0;
    state.errors.length = 0;
    console.log('[XHS Collector] 已清空采集数据。');
  }

  function download() {
    const output = {
      name: 'xiaohongshu_account_api_data',
      generated_at: new Date().toISOString(),
      page_url: location.href,
      total: state.items.length,
      items: state.items,
      errors: state.errors
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: 'application/json;charset=utf-8'
    });

    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `xhs_account_api_data_${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    console.log(`[XHS Collector] 已下载 JSON 文件，共 ${state.items.length} 个接口。`);
    return output;
  }

  window.__xhsCollector = {
    version: '1.0.0',
    targets: TARGETS,
    optionalTargets: OPTIONAL_TARGETS,
    state,
    installPassiveCapture,
    collectNow,
    list,
    summary,
    clear,
    download
  };

  installPassiveCapture();

  console.log(`
[XHS Collector] 已安装。

常用命令：
1. 主动采集 6 个核心接口：
   __xhsCollector.collectNow()

2. 查看已采集接口：
   __xhsCollector.list()

3. 查看缺少哪些接口：
   __xhsCollector.summary()

4. 下载 JSON 文件：
   __xhsCollector.download()

5. 清空后重新采集：
   __xhsCollector.clear()
`);
})();
