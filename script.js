/**
 * Change vertical position, font size and remove background in Netflix subtitles.
 *
 * Usage:
 * Copy and paste this code to browser console (F12 key) while watching Netflix.
 */

const verticalPosition = 300 // from bottom [px]
const fontSize = 24 // [px]

;((vPos, fSize) => {
  callback = () => {
    // .player-timedText
    const subtitles = document.querySelector('.player-timedtext')
    if (subtitles) {
      subtitles.style.bottom = vPos + 'px'

      // .player-timedtext > .player-timedtext-container [0]
      const firstChildContainer = subtitles.firstChild
      if (firstChildContainer) {
        // .player-timedtext > .player-timedtext-container [0] > div
        const firstChild = firstChildContainer.firstChild
        if (firstChild) {
          firstChild.style.backgroundColor = 'transparent'
        }

        // .player-timedtext > .player-timedtext-container [1]
        const secondChildContainer = firstChildContainer.nextSibling
        if (secondChildContainer) {
          for (const span of secondChildContainer.childNodes) {
            // .player-timedtext > .player-timedtext-container [1] > span
            span.style.fontSize = fSize + 'px'
            span.style.fontWeight = 'normal'
          }
          secondChildContainer.style.left = '0'
          secondChildContainer.style.right = '0'
        }
      }
    }
  }

  const observer = new MutationObserver(callback)
  observer.observe(document.body, {
    subtree: true,
    attributes: false,
    childList: true
  })
})(verticalPosition, fontSize)
