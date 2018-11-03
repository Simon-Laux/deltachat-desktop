const React = require('react')
const C = require('deltachat-node/constants')
const { ipcRenderer } = require('electron')

const SetupMessageDialog = require('./dialogs/SetupMessage')
const Composer = require('./Composer')
const { Overlay } = require('@blueprintjs/core')

const MutationObserver = window.MutationObserver

const VirtualList = require('react-tiny-virtual-list').default
const { ConversationContext, Message } = require('./conversations')

const GROUP_TYPES = [
  C.DC_CHAT_TYPE_GROUP,
  C.DC_CHAT_TYPE_VERIFIED_GROUP
]

class ChatView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      error: false,
      setupMessage: false,
      attachmentMessage: null,
      visibleMessages: {}
    }
    this.onSetupMessageClose = this.onSetupMessageClose.bind(this)
    this.focusInputMessage = this.focusInputMessage.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.loadMessagesResp = this.loadMessagesResp.bind(this)
    this.conversationDiv = React.createRef()
  }

  writeMessage (text) {
    const { chat } = this.props
    ipcRenderer.send('dispatch', 'sendMessage', chat.id, text)
  }

  componentWillUnmount () {
    if (this.scrollObserver) this.scrollObserver.disconnect()
    ipcRenderer.removeListener('loadMessagesResp', this.loadMessagesResp)
  }

  attachScrollObserver () {
    if (!this.scrollObserver && this.conversationDiv.current) {
      this.scrollObserver = new MutationObserver(this.scrollToBottom)
      this.scrollObserver.observe(this.conversationDiv.current, { attributes: false, childList: true, subtree: true })
    }
  }

  componentDidUpdate () {
    // this.attachScrollObserver()
    // this.scrollToBottom()
  }

  componentDidMount () {
    this.focusInputMessage()
    this.scrollToBottom()
    ipcRenderer.on('loadMessagesResp', this.loadMessagesResp)
  }

  loadMessagesResp (_, chatId, messages) {
    var self = this
    console.log('loadMessagesresp')
    if (chatId !== this.props.chat.id) return console.error('chat id incorrect')
    var visibleMessages = this.state.visibleMessages
    messages.map((msg) => {
      console.log('msg', msg)
      visibleMessages[msg.id] = msg
    })
    this.setState({ visibleMessages })
    this.promiseResolver()
  }

  scrollToBottom (force) {
    var doc = document.querySelector('.ChatView #the-conversation')
    if (!doc) return console.log(`Didn't find .ChatView #the-conversation element`)

    doc.scrollTop = doc.scrollHeight
  }

  focusInputMessage () {
    let el = document.querySelector('.InputMessage input')
    if (!el) return console.log(`Didn't find .InputMessage input element`)

    el.focus()
  }

  onClickAttachment (attachmentMessage) {
    this.setState({ attachmentMessage })
  }

  onClickSetupMessage (setupMessage) {
    this.setState({ setupMessage })
  }

  onCloseAttachmentView () {
    this.setState({ attachmentMessage: null })
  }

  onSetupMessageClose () {
    this.setState({ setupMessage: false })
  }

  isRowLoaded ({ index }) {
    var message = this.getMessage(index)
    return !!message
  }

  loadMoreRows ({ startIndex, stopIndex }) {
    var self = this
    const chat = self.props.chat
    const messageIds = chat.messageIds.slice(startIndex, stopIndex + 1)
    console.log('loading rows', messageIds, startIndex, stopIndex)
    ipcRenderer.send('loadMessages', chat.id, messageIds)

    self.promiseResolver = null

    return new Promise(resolve => {
      self.promiseResolver = resolve
    })
  }

  getMessage (index) {
    return this.state.visibleMessages[this.props.chat.messageIds[index]]
  }

  rowRenderer ({ index, style }) {
    console.log('row renderer', index, style)
    const conversationType = convertChatType(this.props.chat.type)
    var message = this.getMessage(index)
    if (!message) return console.error('message not found')
    console.log('rendering', index, message)
    return <RenderMessage
      key={index}
      message={message}
      conversationType={conversationType}
      onClickAttachment={this.onClickAttachment.bind(this, message)}
    />
  }

  render () {
    const { attachmentMessage, setupMessage } = this.state
    const { chat } = this.props

    var rowRenderer = this.rowRenderer.bind(this)
    var isRowLoaded = this.isRowLoaded.bind(this)
    var loadMoreRows = this.loadMoreRows.bind(this)

    function itemSize (index) {
      // var item = this.getMessage(index)
      return 50
    }

    return (
      <div className='ChatView'>
        <SetupMessageDialog
          userFeedback={this.props.userFeedback}
          setupMessage={setupMessage}
          onClose={this.onSetupMessageClose}
        />
        <RenderMedia
          filemime={attachmentMessage && attachmentMessage.filemime}
          url={attachmentMessage && attachmentMessage.msg.file}
          close={this.onCloseAttachmentView.bind(this)}
        />

        <VirtualList
          itemCount={chat.messageIds.length}
          height={800}
          width='100%'
          scrollToIndex={chat.messageIds.length - 1}
          itemSize={itemSize}
          estimatedItemSize={40}
          renderItem={rowRenderer} />
        <div className='InputMessage'>
          <Composer onSubmit={this.writeMessage.bind(this)} />
        </div>
      </div>
    )
  }
}

class RenderMedia extends React.Component {
  render () {
    const { url, filemime, close } = this.props
    let elm = <div />
    // TODO: there must be a stable external library for figuring out the right
    // html element to render
    if (filemime) {
      var contentType = convertContentType(filemime)
      switch (contentType.split('/')[0]) {
        case 'image':
          elm = <img src={url} />
          break
        case 'audio':
          elm = <audio src={url} controls='true' />
          break
        case 'video':
          elm = <video src={url} controls='true' />
          break
        default:
          elm = <iframe width='100%' height='100%' src={url} />
      }
    }
    return <Overlay isOpen={Boolean(url)}
      onClose={close}>
      {elm}
    </Overlay>
  }
}

class RenderMessage extends React.Component {
  render () {
    const { onClickAttachment, message, conversationType } = this.props
    const { msg, fromId, id } = message
    const timestamp = msg.timestamp * 1000
    const direction = message.isMe ? 'outgoing' : 'incoming'
    const contact = {
      onSendMessage: () => console.log('send a message to', fromId),
      onClick: () => console.log('clicking contact', fromId)
    }

    function onReply () {
      console.log('reply to', message)
    }

    function onForward () {
      console.log('forwarding message', id)
    }

    function onDownload (el) {
      console.log('downloading', el)
    }

    function onDelete (el) {
      ipcRenderer.send('dispatch', 'deleteMessage', id)
    }

    function onShowDetail () {
      console.log('show detail', message)
    }

    const props = {
      padlock: msg.showPadlock,
      id,
      i18n: window.translate,
      conversationType,
      direction,
      onDownload,
      onReply,
      onForward,
      onDelete,
      onShowDetail,
      contact,
      onClickAttachment,
      authorAvatarPath: message.contact.profileImage,
      authorName: message.contact.name,
      authorPhoneNumber: message.contact.address,
      status: convertMessageStatus(msg.state),
      timestamp
    }

    if (msg.file) {
      props.attachment = { url: msg.file, contentType: convertContentType(message.filemime), filename: msg.text }
    } else {
      props.text = msg.text
    }

    return (<Message {...props} />)
  }
}

function convertContentType (filemime) {
  if (filemime === 'application/octet-stream') return 'audio/ogg'
  return filemime
}

function convertChatType (type) {
  return GROUP_TYPES.includes(type) ? 'group' : 'direct'
}

function convertMessageStatus (s) {
  switch (s) {
    case C.DC_STATE_IN_FRESH:
      return 'sent'
    case C.DC_STATE_OUT_FAILED:
      return 'error'
    case C.DC_STATE_IN_SEEN:
      return 'read'
    case C.DC_STATE_IN_NOTICED:
      return 'read'
    case C.DC_STATE_OUT_DELIVERED:
      return 'delivered'
    case C.DC_STATE_OUT_MDN_RCVD:
      return 'read'
    case C.DC_STATE_OUT_PENDING:
      return 'sending'
    case C.DC_STATE_UNDEFINED:
      return 'error'
  }
}

module.exports = ChatView
