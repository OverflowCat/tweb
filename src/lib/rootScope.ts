import type { Message, StickerSet, Update } from "../layer";
import type { MyDocument } from "./appManagers/appDocsManager";
import type { AppMessagesManager, Dialog, MessagesStorage } from "./appManagers/appMessagesManager";
import type { Poll, PollResults } from "./appManagers/appPollsManager";
import type { MyDialogFilter } from "./storages/filters";
import type { ConnectionStatusChange } from "../types";
import type { UserTyping } from "./appManagers/appChatsManager";
import type Chat from "../components/chat/chat";
import { DEBUG, MOUNT_CLASS_TO, UserAuth } from "./mtproto/mtproto_config";
import { State } from "./appManagers/appStateManager";
import EventListenerBase from "../helpers/eventListenerBase";
import { MyDraftMessage } from "./appManagers/appDraftsManager";

type BroadcastEvents = {
  'user_update': number,
  'user_auth': UserAuth,
  'peer_changed': number,
  'peer_changing': Chat,
  'peer_pinned_messages': {peerId: number, mids?: number[], pinned?: boolean, unpinAll?: true},
  'peer_pinned_hidden': {peerId: number, maxId: number},
  'peer_typings': {peerId: number, typings: UserTyping[]},

  'filter_delete': MyDialogFilter,
  'filter_update': MyDialogFilter,
  'filter_order': number[],
  
  'dialog_draft': {peerId: number, draft: MyDraftMessage | undefined, index: number},
  'dialog_unread': {peerId: number},
  'dialog_flush': {peerId: number},
  'dialog_drop': {peerId: number, dialog?: Dialog},
  'dialog_migrate': {migrateFrom: number, migrateTo: number},
  //'dialog_top': Dialog,
  'dialog_notify_settings': number,
  'dialogs_multiupdate': {[peerId: string]: Dialog},
  'dialogs_archived_unread': {count: number},
  
  'history_append': {peerId: number, messageId: number, my?: boolean},
  'history_update': {storage: MessagesStorage, peerId: number, mid: number},
  'history_reply_markup': {peerId: number},
  'history_multiappend': AppMessagesManager['newMessagesToHandle'],
  'history_delete': {peerId: number, msgs: {[mid: number]: true}},
  'history_forbidden': number,
  'history_reload': number,
  //'history_request': void,
  
  'message_edit': {storage: MessagesStorage, peerId: number, mid: number},
  'message_views': {mid: number, views: number},
  'message_sent': {storage: MessagesStorage, tempId: number, tempMessage: any, mid: number},
  'messages_pending': void,
  'messages_read': void,
  'messages_downloaded': {peerId: number, mids: number[]},
  'messages_media_read': {peerId: number, mids: number[]},

  'replies_updated': Message.message,

  'scheduled_new': {peerId: number, mid: number},
  'scheduled_delete': {peerId: number, mids: number[]},

  'album_edit': {peerId: number, groupId: string, deletedMids: number[]},

  'stickers_installed': StickerSet.stickerSet,
  'stickers_deleted': StickerSet.stickerSet,

  'audio_play': {doc: MyDocument, mid: number, peerId: number},
  'audio_pause': void,
  
  'state_synchronized': number,
  'state_synchronizing': number,
  
  //'contacts_update': any,
  'avatar_update': number,
  'chat_full_update': number,
  'poll_update': {poll: Poll, results: PollResults},
  'chat_update': number,
  'channel_settings': {channelId: number},
  'webpage_updated': {id: string, msgs: number[]},

  'apiUpdate': Update,
  'download_progress': any,
  'connection_status_change': ConnectionStatusChange,
  'settings_updated': {key: string, value: any},
  'draft_updated': {peerId: number, threadId: number, draft: MyDraftMessage | undefined},

  'event-heavy-animation-start': void,
  'event-heavy-animation-end': void,

  'im_mount': void,
  'im_tab_change': number,

  'overlay_toggle': boolean,

  'background_change': void,
};

class RootScope extends EventListenerBase<any> {
  private _overlayIsActive: boolean = false;
  public myId = 0;
  public idle = {
    isIDLE: false
  };
  public connectionStatus: {[name: string]: ConnectionStatusChange} = {};
  public settings: State['settings'];

  constructor() {
    super();

    this.on('user_auth', (e) => {
      this.myId = e;
    });

    this.on('connection_status_change', (e) => {
      const status = e;
      this.connectionStatus[e.name] = status;
    });
  }

  get overlayIsActive() {
    return this._overlayIsActive;
  }

  set overlayIsActive(value: boolean) {
    this._overlayIsActive = value;
    this.broadcast('overlay_toggle', value);
  }

  public broadcast = <T extends keyof BroadcastEvents>(name: T, detail?: BroadcastEvents[T]) => {
    /* if(DEBUG) {
      if(name !== 'user_update') {
        console.debug('Broadcasting ' + name + ' event, with args:', detail);
      }
    } */

    this.setListenerResult(name, detail);
  };

  public on = <T extends keyof BroadcastEvents>(name: T, callback: (e: BroadcastEvents[T]) => any) => {
    this.addListener(name, callback);
  };

  public addEventListener = this.on;

  public off = <T extends keyof BroadcastEvents>(name: T, callback: (e: BroadcastEvents[T]) => any) => {
    this.removeListener(name, callback);
  };

  public removeEventListener = this.off;
}

const rootScope = new RootScope();

MOUNT_CLASS_TO && (MOUNT_CLASS_TO.rootScope = rootScope);
export default rootScope;