const React = require('react')
const { ipcRenderer, remote } = require('electron')
const path = require('path')

const {
  Classes,
  Button,
  Dialog
} = require('@blueprintjs/core')

const dialogs = require('./dialogs')

class Settings extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      keyTransfer: false
    }
    this.initiateKeyTransfer = this.initiateKeyTransfer.bind(this)
    this.onKeyTransferComplete = this.onKeyTransferComplete.bind(this)
    this.onBackupExport = this.onBackupExport.bind(this)
    this.onBackupImport = this.onBackupImport.bind(this)
  }

  onKeyTransferComplete () {
    this.setState({ keyTransfer: false })
  }

  onBackupImport () {
    const tx = window.translate
    var opts = {
      title: tx('backup.importOpenDialogTitle'),
      properties: ['openFile'],
      filters: [{ name: 'DeltaChat .bak', extensions: ['bak'] }]
    }
    remote.dialog.showOpenDialog(opts, filenames => {
      if (!filenames || !filenames.length) return
      ipcRenderer.send('dispatch', 'backupImport', filenames[0])
    })
  }

  onBackupExport () {
    const tx = window.translate
    dialogs.confirmation(tx('backup.confirmationMessage'), response => {
      if (!response) return
      var opts = {
        title: tx('backup.exportSaveDialogTitle'),
        defaultPath: remote.app.getPath('downloads'),
        properties: ['openDirectory']
      }
      remote.dialog.showOpenDialog(opts, filenames => {
        if (!filenames || !filenames.length) return
        ipcRenderer.send('dispatch', 'backupExport', filenames[0])
      })
    })
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
            <Button onClick={this.onBackupExport}>Export backup...</Button>
            <Button onClick={this.onBackupImport}>Import backup...</Button>
          </div>
        </Dialog>
      </div>
    )
  }
}

module.exports = Settings
