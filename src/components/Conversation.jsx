import clientAvatar from '../assets/avatarCliente.png';
import workerAvatar from '../assets/avatarTrabajador.png';
import { ROLES } from '../constants/roles';
import './Conversation.css';

/** One chat in the chat list, showing the other participant. */
export default function Conversation({ chat, viewerRole, selected, onSelect }) {
  const viewerIsClient = viewerRole === ROLES.CLIENT;
  return (
    <button
      type="button"
      className={`conversation${selected ? ' selected' : ''}`}
      onClick={() => onSelect(chat)}
    >
      <img className="conversationImg" src={viewerIsClient ? workerAvatar : clientAvatar} alt="" />
      <span className="conversationText">
        <span className="conversationName">
          {viewerIsClient ? chat.workerName : chat.clientName}
        </span>
        {chat.lastMessage && <span className="conversationLast">{chat.lastMessage}</span>}
      </span>
    </button>
  );
}
