import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { api } from '../functions/api/resource';

const schema = a
  .schema({
    Role: a.enum(['CLIENT', 'WORKER']),

    Category: a.enum([
      'CARPENTRY',
      'LOCKSMITH',
      'ELECTRICIAN',
      'FUMIGATION',
      'GARDENING',
      'CLEANING',
      'PETS',
      'MAINTENANCE',
      'PAINTING',
      'PLUMBING',
      'SECURITY',
    ]),

    Profile: a
      .model({
        userId: a.id().required(),
        name: a.string().required(),
        role: a.ref('Role').required(),
        city: a.string().required(),
      })
      .identifier(['userId'])
      .disableOperations(['subscriptions'])
      .authorization((allow) => [allow.authenticated().to(['read'])]),

    PrivateProfile: a
      .model({
        userId: a.id().required(),
        phone: a.string().required(),
        idNumber: a.string().required(),
        birthDate: a.date().required(),
        address: a.string().required(),
      })
      .identifier(['userId'])
      .disableOperations(['subscriptions'])
      .authorization((allow) => [allow.ownerDefinedIn('userId').identityClaim('sub').to(['read'])]),

    Service: a
      .model({
        workerId: a.id().required(),
        workerName: a.string().required(),
        category: a.ref('Category').required(),
        pricePerHour: a.integer().required(),
        description: a.string().required(),
        ratingSum: a.integer().required(),
        ratingCount: a.integer().required(),
        rating: a.float(),
      })
      .secondaryIndexes((index) => [
        index('workerId').queryField('servicesByWorker'),
        index('category').queryField('servicesByCategory'),
      ])
      .disableOperations(['subscriptions'])
      .authorization((allow) => [allow.authenticated().to(['read']), allow.guest().to(['read'])]),

    Booking: a
      .model({
        serviceId: a.id().required(),
        clientId: a.id().required(),
        workerId: a.id().required(),
        clientName: a.string().required(),
        workerName: a.string().required(),
        category: a.ref('Category').required(),
        address: a.string().required(),
        startAt: a.datetime().required(),
        endAt: a.datetime().required(),
        price: a.integer().required(),
        rating: a.integer(),
      })
      .secondaryIndexes((index) => [
        index('clientId').sortKeys(['startAt']).queryField('bookingsByClient'),
        index('workerId').sortKeys(['startAt']).queryField('bookingsByWorker'),
        index('serviceId').sortKeys(['startAt']).queryField('bookingsByService'),
      ])
      .disableOperations(['subscriptions'])
      .authorization((allow) => [
        allow.ownerDefinedIn('clientId').identityClaim('sub').to(['read']),
        allow.ownerDefinedIn('workerId').identityClaim('sub').to(['read']),
      ]),

    Chat: a
      .model({
        clientId: a.id().required(),
        workerId: a.id().required(),
        clientName: a.string().required(),
        workerName: a.string().required(),
        participants: a.id().required().array().required(),
        lastMessage: a.string(),
        lastMessageAt: a.datetime().required(),
      })
      .secondaryIndexes((index) => [
        index('clientId').sortKeys(['lastMessageAt']).queryField('chatsByClient'),
        index('workerId').sortKeys(['lastMessageAt']).queryField('chatsByWorker'),
      ])
      .authorization((allow) => [allow.ownersDefinedIn('participants').identityClaim('sub').to(['read'])]),

    Message: a
      .model({
        chatId: a.id().required(),
        senderId: a.id().required(),
        content: a.string().required(),
        sentAt: a.datetime().required(),
        participants: a.id().required().array().required(),
      })
      .secondaryIndexes((index) => [index('chatId').sortKeys(['sentAt']).queryField('messagesByChat')])
      .authorization((allow) => [allow.ownersDefinedIn('participants').identityClaim('sub').to(['read'])]),

    Slot: a.customType({
      startAt: a.datetime().required(),
      endAt: a.datetime().required(),
    }),

    busySlots: a
      .query()
      .arguments({ serviceId: a.id().required() })
      .returns(a.ref('Slot').required().array().required())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    registerProfile: a
      .mutation()
      .arguments({
        name: a.string().required(),
        role: a.ref('Role').required(),
        city: a.string().required(),
        phone: a.string().required(),
        idNumber: a.string().required(),
        birthDate: a.date().required(),
        address: a.string().required(),
      })
      .returns(a.ref('Profile'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    editProfile: a
      .mutation()
      .arguments({
        city: a.string().required(),
        phone: a.string().required(),
        address: a.string().required(),
      })
      .returns(a.ref('Profile'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    saveService: a
      .mutation()
      .arguments({
        id: a.id(),
        category: a.ref('Category').required(),
        pricePerHour: a.integer().required(),
        description: a.string().required(),
      })
      .returns(a.ref('Service'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    removeService: a
      .mutation()
      .arguments({ id: a.id().required() })
      .returns(a.id())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    bookService: a
      .mutation()
      .arguments({
        serviceId: a.id().required(),
        startAt: a.datetime().required(),
        durationMinutes: a.integer().required(),
      })
      .returns(a.ref('Booking'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    cancelBooking: a
      .mutation()
      .arguments({ id: a.id().required() })
      .returns(a.id())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    rateBooking: a
      .mutation()
      .arguments({ id: a.id().required(), rating: a.integer().required() })
      .returns(a.ref('Booking'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    openChat: a
      .mutation()
      .arguments({ workerId: a.id().required() })
      .returns(a.ref('Chat'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),

    sendMessage: a
      .mutation()
      .arguments({ chatId: a.id().required(), content: a.string().required() })
      .returns(a.ref('Message'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(api)),
  })
  .authorization((allow) => [allow.resource(api)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
