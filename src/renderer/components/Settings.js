const React = require('react')
const dialogs = require('./dialogs')

const {
  Classes,
  Button,
  ButtonGroup,
  Dialog
} = require('@blueprintjs/core')

class Settings extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      keyTransfer: false
    }
    this.initiateKeyTransfer = this.initiateKeyTransfer.bind(this)
    this.onKeyTransferComplete = this.onKeyTransferComplete.bind(this)
  }

  onKeyTransferComplete () {
    this.setState({ keyTransfer: false })
  }

  initiateKeyTransfer () {
    this.setState({ keyTransfer: true })
  }

  render () {
    const { isOpen, onClose } = this.props
    const { keyTransfer } = this.state

    return (
      <div>
        <dialogs.KeyTransfer isOpen={keyTransfer} onClose={this.onKeyTransferComplete} />
        <Dialog
          isOpen={isOpen}
          title='Settings'
          icon='info-sign'
          onClose={onClose}>
          <div className={Classes.DIALOG_BODY}>
            <h1>Settings</h1>
            <Button onClick={this.initiateKeyTransfer}>Initiate Key Transfer</Button>
          </div>
        </Dialog>
      </div>
    )
  }
}

module.exports = Settings
