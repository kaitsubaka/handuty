import { format } from 'timeago.js';
import clientAvatar from '../assets/avatarCliente.png';
import workerAvatar from '../assets/avatarTrabajador.png';
import { locale } from '../lib/locale';
import './ChatMessage.css';

export default function ChatMessage({ message, own, senderIsWorker }) {
  return (
    <div className={own ? 'message own' : 'message'}>
      <div className="messageTop">
        <img className="messageImg" src={senderIsWorker ? workerAvatar : clientAvatar} alt="" />
        <p className="messageText">{message.content}</p>
      </div>
      <div className="messageBottom">
        {format(message.sentAt, locale === 'en' ? 'en_US' : 'es')}
      </div>
    </div>
  );
}
