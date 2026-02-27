export interface MBTIClass {
  type: string;
  description: string;
}

export const mbtiClasses: MBTIClass[] = [
  {
    type: "E",
    description: "Extroverted - 外向的",
  },
  {
    type: "I",
    description: "Introverted - 内向的",
  },
  {
    type: "S",
    description: "Sensing - 侧重现实",
  },
  {
    type: "N",
    description: "Intuitive - 侧重直觉",
  },
  {
    type: "T",
    description: "Thinking - 侧重逻辑思维",
  },
  {
    type: "F",
    description: "Feeling - 侧重情感",
  },
  {
    type: "P",
    description: "Perceiving - 善于接收",
  },
  {
    type: "J",
    description: "Judging - 善于判断",
  },
];
