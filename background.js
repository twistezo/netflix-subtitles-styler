chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: 'twistezo.github.io' }
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: 'chrome.com' }
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: 'netflix.com' }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ])
  })

  // on active tab update (ex. load/refresh)
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status == 'complete' && tab.active) {
      chrome.storage.local.get(['vPos', 'fSize'], data => {
        if (Object.keys(data).length === 0 && data.constructor === Object) {
          chrome.storage.local.set({ vPos: 300, fSize: 24 })
        }

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.executeScript(
            tabs[0].id,
            {
              file: 'script.js'
            },
            () => {
              const lastErr = chrome.runtime.lastError
              // TODO: fix this
              if (lastErr)
                console.log(
                  'tab: ' + tab.id + ' lastError: ' + JSON.stringify(lastErr)
                )
              chrome.tabs.sendMessage(tabs[0].id, {
                vPos: data.vPos,
                fSize: data.fSize
              })
            }
          )
        })
      })
    }
  })
})
