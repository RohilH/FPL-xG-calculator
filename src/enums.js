export const Position = {
  GOALKEEPER: 'GOALKEEPER',
  DEFENDER: 'DEFENDER',
  MIDFIELDER: 'MIDFIELDER',
  FORWARD: 'FORWARD',

  fromElementType: (elementType) => {
    switch (elementType) {
      case 1:
        return Position.GOALKEEPER;
      case 2:
        return Position.DEFENDER;
      case 3:
        return Position.MIDFIELDER;
      case 4:
        return Position.FORWARD;
      default:
        throw new Error(`Unknown element type: ${elementType}`);
    }
  }
}; 