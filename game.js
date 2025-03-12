const container = document.getElementById('container')
const game = document.getElementById('game')

function measureWindow() {
  game.innerHTML = ''
  const char = document.createElement('div')
  char.style.width = '1ch'
  char.style.height = '1lh'
  char.innerText = 'a'
  game.appendChild(char)
  const rect = char.getBoundingClientRect()
  game.removeChild(char)
  
  const width = Math.floor(window.innerWidth / rect.width)
  const height = Math.floor(window.innerHeight / rect.height)

  if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error('Invalid window size')
  return { width, height }
}

const numbers = [
`
   ,a8888a,       
 ,8P"'  \`"Y8,     
,8P        Y8,    
88          88    
88          88    
\`8b        d8'    
 \`8ba,  ,ad8'     
   "Y8888P"       
`,
`
         88       
       ,d88       
     888888       
         88       
         88       
         88       
         88       
         88       
`,
`
    ad888888b,    
   d8"     "88    
           a8P    
        ,d8P"     
      a8P"        
    a8P'          
   d8"            
   88888888888    
`,
`
    ad888888b,    
   d8"     "88    
           a8P    
        aad8"     
        ""Y8,     
           "8b    
   Y8,     a88    
    "Y888888P'    
`,
`
          ,d8     
        ,d888     
      ,d8" 88     
    ,d8"   88     
  ,d8"     88     
  8888888888888   
           88     
           88     
`,
`
   8888888888     
   88             
   88  ____       
   88a8PPPP8b,    
   PP"     \`8b    
            d8    
   Y8a     a8P    
    "Y88888P"     
`,
`
     ad8888ba,    
    8P'    "Y8    
   d8             
   88,dd888bb,    
   88P'    \`8b    
   88       d8    
   88a     a8P    
    "Y88888P"     
`,
`
   888888888888   
           ,8P'   
          d8"     
        ,8P'      
       d8"        
     ,8P'         
    d8"           
   8P'            
`,
`
    ad88888ba     
   d8"     "8b    
   Y8a     a8P    
    "Y8aaa8P"     
    ,d8"""8b,     
   d8"     "8b    
   Y8a     a8P    
    "Y88888P"     
`,
`
    ad88888ba     
   d8"     "88    
   8P       88    
   Y8,    ,d88    
    "PPPPPP"88    
            8P    
   8b,    a8P     
   \`"Y8888P'      
`
].map(number => stringToMatrix(number.slice(1, -1)))

const headerSpec = [
  [
    '|----',
    '----(*)----',
    '----|',
  ],
  [
    ' \\',
    '_',
    '/ ',
  ],
  [
    ' @-/  | ',
    'V   ',
    ' |  \\-@ '
  ],
  [
    '      ',
    '=',
    '      '
  ],
  [
    '      ||||  ',
    '  ||||  ',
    '  ||||      ',
  ],
  [
    '    __|',
    '_',
    '|__    ',
  ],
  [
    '    \\',
    '=',
    '/    '
  ],
  [
    '       |',
    '=',
    '|       '
  ],
  [
    '         |',
    '_',
    '|         '
  ],
]

const footerSpec = [
  [
    '  |',
    '-',
    '|  ',
  ],
  [
    ' /',
    '_',
    '\\ ',
  ],
  [
    '|',
    ' ',
    '|',
  ],
  [
    '|',
    '_',
    '|',
  ],
]

function repeatTrunc(buf, width) {
  let canvas = ''
  for (let i = 0; i < width; i++) {
    canvas += buf[i % buf.length]
  }
  return canvas
}

function genHeaderFooter(spec, { width }) {
  const canvas = []

  for (const [ left, fill, right ] of spec) {
    if (left.length !== right.length) throw new Error('Mismatched right and left lengths')

    canvas.push([ ...(
      left
        + repeatTrunc(fill, width - left.length - right.length)
        + right
    ) ])
  }
  
  return canvas
}

function stringToMatrix(string) {
  return string.split('\n').map((line) => [ ...line ])
}

const COLUMN_WIDTH = 14
const TOP_COLUMN_OVERDRAW = 1
const BOTTOM_COLUMN_OVERDRAW = 2
const MIN_COLUMN_MIDDLE_HEIGHT = 1
const SIDE_PADDING = 10

function topColumn(middleHeight, cutoff = 0) {
  const top = stringToMatrix(`
|____________|
|============|
 *\\________/* 
   {      }   
   )      (   
  \`--------'  
`.slice(1, -1))
  const middle = new Array(middleHeight).fill(null).map(() => [ ...'   ||||||||   ' ])
  const bottom = stringToMatrix(`
  ==========  
  \`\\/%_%-\\/,  
 )\\/-%\\/%_\\/( 
(@..@.%%.@..@)
^^^^^^^^^^^^^^
`.slice(1, -1))
  const column = [ ...top, ...middle, ...bottom ]
  if (!column.every(line => line.length === COLUMN_WIDTH)) throw new Error('Invalid top column width')
  
  if (cutoff < 0) {
    return column.map((line, i) => {
      if (cutoff <= -line.length) return []

      const barrier = i === 0
        ? '|'
        : i === column.length - 1
          ? '`'
          : '('
      return [ barrier, ...line.slice(-cutoff + 1) ]
    })
  }
  
  if (cutoff > 0) {
    return column.map((line, i) => {
      if (cutoff >= line.length) return []

      const barrier = i === 0
        ? '|'
        : i === column.length - 1
          ? '\''
          : ')'
      return [ ...line.slice(0, -cutoff - 1), barrier ]
    })
  }

  return column
}

function bottomColumn(middleHeight, cutoff = 0) {
  const top = stringToMatrix(`
______________
(@..@.%%.@..@)
 )U-U%U.%U_U( 
  ,U%U_U%-U\`  
  ==========  
`.slice(1, -1))
  const middle = new Array(middleHeight).fill(null).map(() => [ ...'   ||||||||   ' ])
  const bottom = stringToMatrix(`
  ,________,  
   )      (   
   {      }   
 _/________\\_ 
|____________|
| ---------- |
|____________|
`.slice(1, -1))
  const column = [...top, ...middle, ...bottom]
  if (!column.every(line => line.length === COLUMN_WIDTH)) throw new Error('Invalid bottom column width')

  if (cutoff < 0) {
    return column.map((line, i) => {
      if (cutoff <= -line.length) return []

      const barrier = i === 0
        ? ','
        : i >= column.length - 2
          ? '|'
          : '('
      return [ barrier, ...line.slice(-cutoff + 1) ]
    })
  }
  
  if (cutoff > 0) {
    return column.map((line, i) => {
      if (cutoff >= line.length) return []

      const barrier = i === 0
        ? '\\'
        : i >= column.length - 2
          ? '|'
          : ')'
      return [ ...line.slice(0, -cutoff - 1), barrier ]
    })
  }

  return column
}

function printNumber(number) {
  return JSON.parse(JSON.stringify(number
    .toString()
    .split('')
    .map(char => numbers[char.charCodeAt(0) - '0'.charCodeAt(0)])
    .reduce((p, c) => stackHorizontal(p, c))))
}

const TOP_COLUMN_BASELINE_HEIGHT = topColumn(0, 0).length
const BOTTOM_COLUMN_BASELINE_HEIGHT = bottomColumn(0, 0).length

// Inclusive range RNG
function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function fill({ width, height }, char = ' ') {
  const canvas = []
  for (let y = 0; y < height; y++) {
    canvas.push(new Array(width).fill(char))
  }
  return canvas
}

function draw(buf, { x, y }, canvas, ignore = null) {
  if (x === 'center') {
    x = Math.round(canvas[0].length / 2) - Math.round(buf[0].length / 2)
  }
  if (y === 'center') {
    y = Math.round(canvas.length / 2) - Math.round(buf.length / 2)
  }

  for (let by = 0; by < buf.length; by++) {
    for (let bx = 0; bx < buf[by].length; bx++) {
      if (ignore && buf[by][bx] === ignore) continue
      canvas[y + by][x + bx] = buf[by][bx]
    }
  }
}

function stackHorizontal(a, b) {
  return a.map((line, i) => [ ...line, ...b[i] ])
}

const SEGMENT_TEXT = 'corinthium'

function initialState() {
  return {
    topColumns: [],
    bottomColumns: [],
    vy: 0,
    score: 0,
    segmentYs: new Array(SEGMENT_TEXT.length).fill(Math.round(measureWindow().height / 2)),
    gameOverAt: null,
  }
}

const state = initialState()

function getHighScore() {
  let highScore
  try {
    highScore = JSON.parse(localStorage.getItem('high')) ?? 0
  } catch {
    highScore = 0
  }
  if (state.score > highScore) {
    highScore = state.score
    localStorage.setItem('high', JSON.stringify(highScore))
  }
  return highScore
}

function render() {
  const size = measureWindow()
  const canvas = fill(size)

  const header = genHeaderFooter(headerSpec, size)
  draw(header, { x: 0, y: 0 }, canvas)

  const footer = genHeaderFooter(footerSpec, size)
  draw(footer, { x: 0, y: size.height - footer.length }, canvas)

  // Spawn columns
  {
    const usableColumnHeight = size.height
      - header.length + TOP_COLUMN_OVERDRAW
      - footer.length + BOTTOM_COLUMN_OVERDRAW
      - TOP_COLUMN_BASELINE_HEIGHT
      - BOTTOM_COLUMN_BASELINE_HEIGHT
      - MIN_COLUMN_MIDDLE_HEIGHT * 2
    while (true) {
      const distance = randRange(25, 50)

      const lastColumnX = state.topColumns.at(-1)?.x ?? (size.width - (size.width < 100 ? 60 : 100))
      if (lastColumnX + COLUMN_WIDTH + distance > size.width) break

      const gap = randRange(10, 20)
      const gapY = randRange(0, usableColumnHeight - gap)

      state.topColumns.push({
        middleHeight: gapY + MIN_COLUMN_MIDDLE_HEIGHT,
        x: lastColumnX + COLUMN_WIDTH + distance,
      })
      state.bottomColumns.push({
        middleHeight: usableColumnHeight - gapY - gap + MIN_COLUMN_MIDDLE_HEIGHT,
        x: lastColumnX + COLUMN_WIDTH + distance,
      })
    }
  }

  {
    const usableWidth = size.width - SIDE_PADDING * 2 - COLUMN_WIDTH

    // Render top columns
    for (let i = 0; i < state.topColumns.length; i++) {
      const { middleHeight, x } = state.topColumns[i]

      const buf = topColumn(
        middleHeight,
        x < 0
          ? x
          : x > usableWidth
            ? x - usableWidth - 1
            : 0
      )
      if (x < 0 && buf[0].length === 0) {
        state.topColumns.splice(i, 1)
        i--
        continue
      }
      draw(buf, { x: SIDE_PADDING + Math.max(0, x), y: header.length - TOP_COLUMN_OVERDRAW }, canvas)
    }

    // Render bottom columns
    for (let i = 0; i < state.bottomColumns.length; i++) {
      const { middleHeight, x } = state.bottomColumns[i]

      const buf = bottomColumn(
        middleHeight,
        x < 0
          ? x
          : x > usableWidth
            ? x - usableWidth - 1
            : 0
      )
      if (x < 0 && buf[0].length === 0) {
        state.bottomColumns.splice(i, 1)
        i--
        continue
      }
      draw(buf, { x: SIDE_PADDING + Math.max(0, x), y: size.height - buf.length - BOTTOM_COLUMN_OVERDRAW }, canvas)
    }
  }

  // Check player collisions
  {
    const top = header.length
    const bottom = size.height - footer.length

    for (let i = 0; i < state.segmentYs.length; i++) {
      const roundY = Math.round(state.segmentYs[i])
      const x = 32 - i

      if (state.segmentYs[i] <= top) {
        state.segmentYs[i] = top 
        if (i === 0) state.vy = 0
      } else if (state.segmentYs[i] >= bottom) {
        state.segmentYs[i] = bottom
        if (i === 0) state.vy = 0
      }

      const isColliding = (canvas[roundY][x] !== ' ' && roundY > top && roundY < bottom)
        || canvas[roundY][x] === '|'
      
      if (!state.gameOverAt && isColliding) {
        // Collision!
        console.log('Collision!', i, roundY, x, canvas[roundY][x])
        state.gameOverAt = Date.now()
        render()
        return
      }

      draw([[SEGMENT_TEXT[SEGMENT_TEXT.length - i - 1]]], { x, y: roundY }, canvas)
    }
  }

  if (state.gameOverAt) {
    const dialog = stringToMatrix(`
                                         
                                         
    ┌───────────────────────────────┐    
    │                               │    
    │           GAME OVER           │    
    │                               │    
    │                               │    
    │                               │    
    │                               │    
    │   Press SPACE to play again   │    
    │                               │    
    └───────────────────────────────┘    
                                         
                                         
`.slice(1, -1))
    draw(stringToMatrix(`Score: ${state.score}`), { x: 'center', y: 6 }, dialog)
    draw(stringToMatrix(`High Score: ${getHighScore()}`), { x: 'center', y: 7 }, dialog)
    draw(dialog, { x: 'center', y: 'center' }, canvas)
  } else {
    const newCanvas = fill(size)
    
    if (size.width > 100) {
      const score = printNumber(state.score)
      
      for (let i = 0; i < 2; i++) score.push(new Array(score[0].length).fill(' '))
      const high = stringToMatrix(`High Score: ${getHighScore()}`)
      draw(high, {
        x: score[0].length - high[0].length - 4 ,
        y: score.length - 1
      }, score)
      
      draw(score, {
        x: size.width - score[0].length - 10,
        y: 'center',
      }, newCanvas)
    } else {
      const score = stringToMatrix(`${state.score} (${getHighScore()})`)
      draw(score, {
        x: size.width - score[0].length - 4,
        y: 'center',
      }, newCanvas)
    }
    
    draw(canvas, { x: 0, y: 0 }, newCanvas, ' ')
    draw(newCanvas, { x: 0, y: 0 }, canvas)
  }
  
  container.style.width = `${size.width}ch`
  container.style.height = `${size.height}lh`
  // container.style.userSelect = state.gameOver ? '' : 'none'
  game.innerText = canvas.map(line => line.join('')).join('\n')
}

const TENSION = 0.25 

function tick() {  
  if (state.gameOverAt) return
  state.score++

  for (const column of state.topColumns) column.x--
  for (const column of state.bottomColumns) column.x--

  const oldYs = [ ...state.segmentYs ]
  for (let i = 1; i < state.segmentYs.length; i++) {
    state.segmentYs[i] = oldYs[i - 1]
  }

  state.vy += 0.3
  state.segmentYs[0] += state.vy

  render() // This checks collisions, so has to go before tension

  // Handle tension
  for (let i = 1; i < state.segmentYs.length; i++) {
    const diff = state.segmentYs[i - 1] - state.segmentYs[i]
    state.segmentYs[i] += diff * TENSION
  }

  render() // Render again to update post-tension positions. Stupid? Yes!
}

setInterval(tick, 60)

render()

window.addEventListener('resize', render)

function onActivate() {
  if (state.gameOverAt) {
    if (Date.now() - state.gameOverAt < 600) return
    Object.assign(state, initialState())
    render()
  } else {
    state.vy = -2.5
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === ' ') onActivate()
})
window.addEventListener('pointerdown', (e) => {
  if (e.target.tagName === 'A') return 
  onActivate()
})
