const React = require('react')
const dialogs = require('./dialogs')

class Settings extends React.Component {
  constructor (props) {
    this.state = {
      keyTransfer: false
    }
    super(props)
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
    const { keyTransfer } = this.state

    return (
      <div>
        <dialogs.KeyTransfer isOpen={keyTransfer} onClose={this.onKeyTransferComplete} />

        <h1>Settings</h1>
      </div>
    )
  }
}

module.exports = Settings
