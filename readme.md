In my example I am using Socket.io for channel events and Twitch IRC WebSocket API for channel chat.
Also using SQlite for simplicity.
This is by no means production ready for following reasons.
1. I am using SQlite
2. I haven't used a storage like Redis for Socket.io and currently everything is stored in the memory which in turn makes this
  program prone to memory leaks.

# How would you deploy the above on AWS? (ideally a rough architecture diagram will help)

![architecture diagram](https://github.com/sajjad26/twitch-example/raw/master/twitch-example.jpg "Architecture Diagram")

As indicated in the diagram above I would host two separate applications. 
1. First is the normal Node App which serves web pages and is responsible for other
  application login.
2. Second is also a Node app but is only responsible for the WebSocket connections that we use for channel events.
3. Both apps should be hosted behind an Application Load Balancer (ALB) with auto scaling
4. For database we should RDS
5. For Socket.io App we should ElastiCache as storage

# Where do you see bottlenecks in your proposed architecture and how would you approach scaling this app starting from 100 reqs/day to 900MM reqs/day over 6 months?

If we deploy the application as per my suggestion in the architecture diagram above we should be fine for however many requests.
