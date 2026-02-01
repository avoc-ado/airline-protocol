export interface PythPushFeed {
  label: string;
  account: string;
  feedId: string;
}

export const OPENBOOK_V2_PROGRAM_ID = "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb";
export const PYTH_PUSH_PROGRAM_ID = "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ";
export const PYTH_PUSH_FEEDS: readonly PythPushFeed[] = [
  {
    label: "SOL/USD",
    account: "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
    feedId: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
  },
  {
    label: "MSOL/USD",
    account: "5CKzb9j4ChgLUt8Gfm5CNGLN6khXKiqMbnGAW4cgXgxK",
    feedId: "c2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4"
  },
  {
    label: "USDC/USD",
    account: "Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX",
    feedId: "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
  }
];

export const makeTestContext = ({ label }: { label: string }): { label: string } => ({ label });
