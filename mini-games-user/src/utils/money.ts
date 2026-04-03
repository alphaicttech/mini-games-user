const asMicro = (value: string) => BigInt(Math.round(Number(value) * 1_000_000));
const fromMicro = (value: bigint) => (Number(value) / 1_000_000).toFixed(6);

export const addMoney = (a: string, b: string) => fromMicro(asMicro(a) + asMicro(b));
export const subMoney = (a: string, b: string) => fromMicro(asMicro(a) - asMicro(b));
export const ltMoney = (a: string, b: string) => asMicro(a) < asMicro(b);
