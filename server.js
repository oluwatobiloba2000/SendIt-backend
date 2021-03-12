import server from './app';

const PORT = process.env.PORT || 4004;

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`app is listening on localhost:${PORT}`);
});
