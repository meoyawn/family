let el: HTMLImageElement

export const imgEl = (url: string): HTMLImageElement => {
  if (!el) {
    el = document.createElement('img')
  }
  el.src = url
  return el
}

export const dataImageSvgXml = (svg: string): string =>
  "data:image/svg+xml," + svg

export const dataImg = (svg: string): HTMLImageElement =>
  imgEl(dataImageSvgXml(svg))
