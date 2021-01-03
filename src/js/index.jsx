import React from 'react'
import { render } from 'react-dom'
import Tree from './components/tree'
import { createFileTree, createRootElement, getBrowserApi, hideAllDiffs, StorageSync } from './lib'

import './style.css'

const { document, MutationObserver, FontFace, parseInt = Number.parseInt } = window

let observer
const observe = () => {
  observer && observer.disconnect()
  const pjaxContainer = document.querySelector('[data-pjax-container]')
  observer = new MutationObserver(start)
  observer.observe(pjaxContainer, { childList: true })
}

class Top extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      tree: null
    }
  }

  componentDidMount () {
    this.calculateTree()
  }

  calculateTree () {
    const isFilteredToCommit = Boolean(document.querySelector('.js-commits-filtered'))
    const fileCount = parseInt((document.getElementById('files_tab_counter') || { innerText: 0 }).innerText, 10)
    const { tree, count } = createFileTree()

    this.setState({ tree })

    if (isFilteredToCommit) {
      return
    }

    if (fileCount !== count) {
      setTimeout(this.calculateTree.bind(this), 100)
    } else {
      initSingleDiff()
    }
  }

  render () {
    const { tree } = this.state
    if (!tree) {
      return null
    }
    return <Tree root={tree} />
  }
}

const renderTree = () => {
  const fileCount = parseInt((document.getElementById('files_tab_counter') || { innerText: 0 }).innerText, 10)
  const rootElement = createRootElement()
  const enabled = Boolean(rootElement && fileCount > 0)
  document.body.classList.toggle('enable_better_github_pr', enabled)
  if (!enabled) {
    return
  }

  render(<Top />, rootElement)
}

const loadFonts = () => {
  const fonts = [
    { name: 'FontAwesome', fileName: 'fontawesome.woff2' },
    { name: 'Mfizz', fileName: 'mfixx.woff2' },
    { name: 'Devicons', fileName: 'devopicons.woff2' },
    { name: 'file-icons', fileName: 'file-icons.woff2' },
    { name: 'octicons', fileName: 'octicons.woff2' }
  ]

  fonts
    .map(({ name, fileName }) => new FontFace(
      name,
      `url("${getBrowserApi().runtime.getURL(`fonts/${fileName}`)}") format("woff2")`,
      { style: 'normal', weight: 'normal' }
    ))
    .forEach(async fontFace => {
      const loadedFont = await fontFace.load()
      document.fonts.add(loadedFont)
    })
}

const initSingleDiff = async () => {
  const options = await StorageSync.get()
  if (!options.singleDiff) {
    return
  }

  hideAllDiffs()

  const id = window.location.href.split('#')[1]

  // if we have a diff ref in the URL try to unhide it
  if (id) {
    const currentDiff = document.getElementById(id)

    if (currentDiff) {
      currentDiff.style.display = 'block'
    }
  }
}

const start = () => {
  observe()
  renderTree()
}

loadFonts()
observe()
start()
