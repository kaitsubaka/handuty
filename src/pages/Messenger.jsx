import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import AppLayout from '../components/AppLayout';
import ChatMessage from '../components/ChatMessage';
import Conversation from '../components/Conversation';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import MessageModal from '../components/MessageModal';
import { ROLES } from '../constants/roles';
import { useSession } from '../context/Session';
import { client } from '../lib/amplify';
import { errorMessageId, run } from '../lib/api';
import { all, myChats } from '../lib/queries';
import './Messenger.css';

const MAX_LENGTH = 1000;

function appendUnique(messages, message) {
  return messages.some((item) => item.id === message.id) ? messages : [...messages, message];
}

function withMessage(thread, message) {
  return thread.chatId === message.chatId
    ? { ...thread, messages: appendUnique(thread.messages, message) }
    : thread;
}

function withActivity(chats, chatId, message) {
  const updated = chats.map((chat) =>
    chat.id === chatId ? { ...chat, lastMessage: message.content, lastMessageAt: message.sentAt } : chat,
  );
  return updated.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export default function Messenger() {
  const intl = useIntl();
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('chat');
  const [chats, setChats] = useState(null);
  const [thread, setThread] = useState({ chatId: null, messages: [] });
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [errorId, setErrorId] = useState(null);
  const bottom = useRef(null);
  const selected = chats?.find((chat) => chat.id === selectedId) ?? null;
  const openChatId = selected?.id;
  const messages = thread.chatId === openChatId ? thread.messages : [];

  useEffect(() => {
    myChats(session)
      .then(setChats)
      .catch((error) => {
        console.error('[messages] could not load chats', error);
        setChats([]);
        setErrorId('serverProblem');
      });
  }, [session]);

  useEffect(() => {
    if (!openChatId) {
      return undefined;
    }
    let active = true;
    all((nextToken) =>
      client.models.Message.messagesByChat({ chatId: openChatId }, { sortDirection: 'ASC', limit: 100, nextToken }),
    )
      .then((loaded) => active && setThread({ chatId: openChatId, messages: loaded }))
      .catch((error) => console.error('[messages] could not load messages', error));
    const subscription = client.models.Message.onCreate({ filter: { chatId: { eq: openChatId } } }).subscribe({
      next: (message) => {
        setThread((current) => withMessage(current, message));
        setChats((current) => withActivity(current, message.chatId, message));
      },
      error: (error) => console.warn('[messages] live updates stopped', error),
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [openChatId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  async function handleSend(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selected) {
      return;
    }
    setSending(true);
    try {
      const message = await run(client.mutations.sendMessage({ chatId: selected.id, content }));
      setThread((current) => withMessage(current, message));
      setChats((current) => withActivity(current, selected.id, message));
      setDraft('');
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSending(false);
    }
  }

  if (chats === null) {
    return (
      <AppLayout>
        <div className="messenger">
          <Loading />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="messenger">
        {chats.length === 0 ? (
          <EmptyState messageId={session.profile.role === ROLES.CLIENT ? 'NoChatsClient' : 'NoChatsWorker'} />
        ) : (
          <div className="chatPrincipal">
            <div className="chatMenu">
              <div className="chatMenuWrapper">
                {chats.map((chat) => (
                  <Conversation
                    key={chat.id}
                    chat={chat}
                    viewerRole={session.profile.role}
                    selected={chat.id === selectedId}
                    onSelect={() => setParams({ chat: chat.id })}
                  />
                ))}
              </div>
            </div>
            <div className="chatBox">
              <div className="chatBoxWrapper">
                {selected ? (
                  <>
                    <div className="chatBoxTop" aria-live="polite">
                      {messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          own={message.senderId === session.userId}
                          senderIsWorker={message.senderId === selected.workerId}
                        />
                      ))}
                      <div ref={bottom} />
                    </div>
                    <form className="chatBoxBottom" onSubmit={handleSend}>
                      <textarea
                        className="chatMessageInput"
                        aria-label={intl.formatMessage({ id: 'WriteMessage' })}
                        placeholder={intl.formatMessage({ id: 'WriteMessage' })}
                        maxLength={MAX_LENGTH}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            handleSend(event);
                          }
                        }}
                      />
                      <button type="submit" className="chatSubmitButton" disabled={sending || !draft.trim()}>
                        <FormattedMessage id="Send" />
                      </button>
                    </form>
                  </>
                ) : (
                  <EmptyState messageId="SelectChat" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
    </AppLayout>
  );
}
