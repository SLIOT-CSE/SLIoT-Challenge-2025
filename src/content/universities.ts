// Universities offered in the registration dropdown. "Other" is added by the form.
//
// TODO(2027): proposed list from docs/architecture.md section 6.1. Confirm before launch.

export const universities = [
  // State universities
  "University of Colombo",
  "University of Peradeniya",
  "University of Sri Jayewardenepura",
  "University of Kelaniya",
  "University of Moratuwa",
  "University of Jaffna",
  "University of Ruhuna",
  "Open University of Sri Lanka",
  "Eastern University, Sri Lanka",
  "South Eastern University of Sri Lanka",
  "Rajarata University of Sri Lanka",
  "Sabaragamuwa University of Sri Lanka",
  "Wayamba University of Sri Lanka",
  "Uva Wellassa University",
  "University of the Visual and Performing Arts",
  "University of Vavuniya",
  "Gampaha Wickramarachchi University of Indigenous Medicine",
  // Defence
  "General Sir John Kotelawala Defence University",
  // Larger private institutes
  "SLIIT",
  "NSBM Green University",
  "Informatics Institute of Technology (IIT)",
  "Sri Lanka Technological Campus (SLTC)",
  "Asia Pacific Institute of Information Technology (APIIT)",
  "CINEC Campus",
  "Horizon Campus",
  "ICBT Campus",
] as const;

export type University = (typeof universities)[number];
