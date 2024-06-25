export const timeslot: string[][] = [
  ["9:00", "10:00", "11:00", "12:00"],
  ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  ["19:00", "20:00", "21:00", "22:00"],
];

export const routes: any = {
  assumption_university_to_mega_bangna: {
    from: "Assumption University",
    to: "Mega Bangna",
    time: [
      ["9:00", "10:00", "11:00", "12:00"],
      ["14:00", "15:00", "16:00", "17:00", "18:00"],
      ["19:00", "20:00", "21:00", "22:00"],
    ],
  },
  assumption_university_to_siam_paragon: {
    from: "Assumption University",
    to: "Siam Paragon",
    time: [
      ["9:00", "10:00", "11:00", "12:00"],
      ["13:00", "14:00", "17:00", "18:00"],
      ["19:00", "20:00", "21:00", "22:00"],
    ],
  },
  mega_bangna_to_assumption_university: {
    from: "Assumption University",
    to: "Mega Bangna",
    time: [
      ["9:00", "10:00", "12:00"],
      ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
      ["21:00", "22:00"],
    ],
  },
  siam_paragon_to_assumption_university: {
    from: "Assumption University",
    to: "Siam Paragon",
    time: [
      ["12:00"],
      ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
      ["19:00", "20:00", "21:00", "22:00"],
    ],
  },
};
