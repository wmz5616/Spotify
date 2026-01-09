module.exports = {
  parseFile: jest.fn().mockResolvedValue({
    common: {
      track: { no: 1 },
      picture: [],
    },
    format: {
      duration: 180,
    },
  }),
};