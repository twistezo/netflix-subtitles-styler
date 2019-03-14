const changeBtn = document.getElementById('change')
const vPosInput = document.getElementById('vPos')
const fSizeInput = document.getElementById('fSize')

;(() => {
  chrome.storage.local.get(['vPos', 'fSize'], data => {
    vPosInput.value = data.vPos
    fSizeInput.value = data.fSize
  })
})()

changeBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const vPos = vPosInput.value
    const fSize = fSizeInput.value

    chrome.storage.local.set({ vPos, fSize })
    chrome.tabs.executeScript(
      tabs[0].id,
      {
        file: 'script.js'
      },
      () => {
        chrome.tabs.sendMessage(tabs[0].id, { vPos, fSize })
      }
    )
  })
})
