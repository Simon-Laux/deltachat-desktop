import { C } from '@deltachat/jsonrpc-client'
import { msgStatus } from '../../types-app'

export function mapCoreMsgStatus2String(state: number): msgStatus {
  switch (state) {
    case C.DC_STATE_OUT_FAILED:
      return 'error'
    case C.DC_STATE_OUT_PENDING:
      return 'sending'
    case C.DC_STATE_OUT_PREPARING:
      return 'sending'
    case C.DC_STATE_OUT_DRAFT:
      return 'draft'
    case C.DC_STATE_OUT_DELIVERED:
      return 'delivered'
    case C.DC_STATE_OUT_MDN_RCVD:
      return 'read'
    case C.DC_STATE_IN_FRESH:
      return 'in_fresh'
    case C.DC_STATE_IN_SEEN:
      return 'in_seen'
    case C.DC_STATE_IN_NOTICED:
      return 'in_noticed'
    default:
      return '' // to display no icon on unknown state
  }
}
