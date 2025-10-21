// soilMockData.js
const soilData = [
  {
    parcel: "Parcela 1",
    samples: [
      { parameter: "pH", attention: "yellow", direction: "left", date: "2025-03-01" },
      { parameter: "pH", attention: "dark-green", direction: "center", date: "2025-06-15" },
      { parameter: "N", attention: "light-green", direction: "right", date: "2025-06-20" },
      { parameter: "K", attention: "red", direction: "right", date: "2025-07-10" },
    ],
  },
  {
    parcel: "Parcela 2",
    samples: [
      { parameter: "pH", attention: "orange", direction: "left", date: "2025-02-18" },
      { parameter: "N", attention: "yellow", direction: "right" },
      { parameter: "K", attention: "red", direction: "right" },
    ],
  },
  {
    parcel: "Parcela 3",
    samples: [
      { parameter: "pH", attention: "light-green", direction: "center" },
      { parameter: "N", attention: "dark-green", direction: "left" },
      { parameter: "K", attention: "yellow", direction: "right" },
    ],
  },
];

export default soilData;
