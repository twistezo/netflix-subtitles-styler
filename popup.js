const changeBtn = document.getElementById('change')
const vPosInput = document.getElementById('vPos')
const fSizeInput = document.getElementById('fSize')
const fColorInput = document.getElementById('fColor')
const errorEl = document.getElementById('error')

;(() => {
  chrome.storage.local.get(['vPos', 'fSize', 'fColor'], data => {
    vPosInput.value = data.vPos
    fSizeInput.value = data.fSize
    fColorInput.value = data.fColor
  })
})()

changeBtn.addEventListener('click', () => {
  const vPos = vPosInput.value
  const fSize = fSizeInput.value
  const fColor = fColorInput.value

  if (!validateForm(vPos, fSize, fColor)) return
  error('')

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.storage.local.set({ vPos, fSize, fColor })
    chrome.tabs.executeScript(
      tabs[0].id,
      {
        file: 'script.js'
      },
      () => {
        const error = chrome.runtime.lastError
        if (error) 'Error. Tab ID: ' + tab.id + ': ' + JSON.stringify(error)

        chrome.tabs.sendMessage(tabs[0].id, { vPos, fSize, fColor })
      }
    )
  })
})

validateForm = (vPos, fSize, fColor) => {
  let isValid = false
  if (vPos < 0 || vPos > 5000) {
    error('Vertical position must be between 0 - 5000 [px].')
    return isValid
  }
  if (isNaN(vPos)) {
    error('Vertical position is a not valid number.')
    return isValid
  }
  if (fSize < 0 || fSize > 300) {
    error('Font size must be between 0 - 300 [px].')
    return isValid
  }
  if (isNaN(fSize)) {
    error('Font size is not a valid number.')
    return isValid
  }
  if (!RegExp('^#[0-9A-F]{6}$').test(fColor)) {
    error('Color is not a valid HEX')
    return isValid
  }

  isValid = true
  return isValid
}

error = message => {
  errorEl.innerText = message
}
