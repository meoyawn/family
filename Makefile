deploy:
	yarn lint
	vercel --prod
	say "deployed"

elkworker:
	cp node_modules/elkjs/lib/elk-worker.min.js public/elk-worker.min.js
