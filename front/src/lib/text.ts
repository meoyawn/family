interface Size {
  width: number,
  height: number
}

let el: HTMLSpanElement

const cache: Partial<Record<string, Size>> = {}

export const measureText = (text: string, style?: Partial<CSSStyleDeclaration>): Size => {
  const cached = cache[text]
  if (cached) return cached

  if (!el) {
    el = document.createElement('span')
    document.body.append(el)
  }

  el.style.position = "fixed"
  Object.assign(el.style, style)

  el.innerText = text

  const size = {
    width: el.clientWidth,
    height: el.clientHeight,
  }

  cache[text] = size

  return size
}
