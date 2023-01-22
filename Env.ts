const schema = {
	type: 'object',
	required: ['PORT'],
	properties: {
		PORT: {
			type: 'number',
			default: 5000,
		},
	},
};
// declare module 'fastify' {
// 	interface FastifyInstance {
// 		config: {
// 			PORT: number;
// 		};
// 	}
// }
// server.register(fastifyEnv, {
// 	data: process.env,
// 	schema,
// 	dotenv: true,
// });
