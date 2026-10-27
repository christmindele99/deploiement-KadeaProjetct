import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'register.show': { paramsTuple?: []; params?: {} }
    'register.store': { paramsTuple?: []; params?: {} }
    'auth.checkEmail': { paramsTuple?: []; params?: {} }
    'verify-email.show': { paramsTuple?: []; params?: {} }
    'verify-email.resend': { paramsTuple?: []; params?: {} }
    'verify-email.confirm': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'login.show': { paramsTuple?: []; params?: {} }
    'login.store': { paramsTuple?: []; params?: {} }
    'forgot-password.show': { paramsTuple?: []; params?: {} }
    'forgot-password.store': { paramsTuple?: []; params?: {} }
    'reset-password.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'reset-password.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'chat.index': { paramsTuple?: []; params?: {} }
    'politique-confidentialite.show': { paramsTuple?: []; params?: {} }
    'commentaire.show': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'conversations.index': { paramsTuple?: []; params?: {} }
    'conversations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'conversations.store': { paramsTuple?: []; params?: {} }
    'conversations.toggle_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'conversations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple?: []; params?: {} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'conversations.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profiles.show': { paramsTuple?: []; params?: {} }
    'confidentialite.show': { paramsTuple?: []; params?: {} }
    'profiles.update': { paramsTuple?: []; params?: {} }
    'profile.changePassword': { paramsTuple?: []; params?: {} }
    'profiles.update_avatar': { paramsTuple?: []; params?: {} }
    'groups.store': { paramsTuple?: []; params?: {} }
    'groups.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'groups.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'logout.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'event_stream': { paramsTuple?: []; params?: {} }
    'register.show': { paramsTuple?: []; params?: {} }
    'auth.checkEmail': { paramsTuple?: []; params?: {} }
    'verify-email.show': { paramsTuple?: []; params?: {} }
    'verify-email.confirm': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'login.show': { paramsTuple?: []; params?: {} }
    'forgot-password.show': { paramsTuple?: []; params?: {} }
    'reset-password.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'chat.index': { paramsTuple?: []; params?: {} }
    'politique-confidentialite.show': { paramsTuple?: []; params?: {} }
    'commentaire.show': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'conversations.index': { paramsTuple?: []; params?: {} }
    'conversations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profiles.show': { paramsTuple?: []; params?: {} }
    'confidentialite.show': { paramsTuple?: []; params?: {} }
    'groups.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'event_stream': { paramsTuple?: []; params?: {} }
    'register.show': { paramsTuple?: []; params?: {} }
    'auth.checkEmail': { paramsTuple?: []; params?: {} }
    'verify-email.show': { paramsTuple?: []; params?: {} }
    'verify-email.confirm': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'login.show': { paramsTuple?: []; params?: {} }
    'forgot-password.show': { paramsTuple?: []; params?: {} }
    'reset-password.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'chat.index': { paramsTuple?: []; params?: {} }
    'politique-confidentialite.show': { paramsTuple?: []; params?: {} }
    'commentaire.show': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'conversations.index': { paramsTuple?: []; params?: {} }
    'conversations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profiles.show': { paramsTuple?: []; params?: {} }
    'confidentialite.show': { paramsTuple?: []; params?: {} }
    'groups.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'register.store': { paramsTuple?: []; params?: {} }
    'verify-email.resend': { paramsTuple?: []; params?: {} }
    'login.store': { paramsTuple?: []; params?: {} }
    'forgot-password.store': { paramsTuple?: []; params?: {} }
    'reset-password.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'conversations.store': { paramsTuple?: []; params?: {} }
    'messages.store': { paramsTuple?: []; params?: {} }
    'conversations.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'groups.store': { paramsTuple?: []; params?: {} }
    'logout.destroy': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'conversations.toggle_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profiles.update': { paramsTuple?: []; params?: {} }
    'profile.changePassword': { paramsTuple?: []; params?: {} }
    'profiles.update_avatar': { paramsTuple?: []; params?: {} }
    'groups.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'conversations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}