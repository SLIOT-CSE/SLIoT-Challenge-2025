import GuilineHeader from '@/components/GuideLineHeader';
import { useState } from 'react';
import { motion } from "framer-motion";

const SelectedTeams = () => {
  const [activeTab, setActiveTab] = useState('school');

  const teams = {
    school: [
        // { name: "RC Rescue Robot", school: "G/Dharmasoka College, Ambalangoda" },
        // { name: "LakminaGCK_OcrDigiDic", school: "Gateway College" },
        // { name: "TechRiders", school: "Gateway College Kandy" },
        // { name: "Quantum Pioneers", school: "R/Ehe/Darmapala College" },
        // { name: "Aloka Tek Teach", school: "Ananda Sastralaya Mathugama" },
        // { name: "Alfa bot 3.0", school: "R/Kuruwita Central College" }, ///
        // { name: "REVORA", school: "R/Kuruwita Central College" },
        // { name: "Pathsence", school: "R/Kuruwita Central College (National School)" }, ///
        // { name: "Online Voting Hub", school: "R/Kuruwita Central College (National School)" },
        { name: "Hydro Teams", school: "G/Sacred Heart Convent" }, ///
        // { name: "Smart Pouch", school: "R/Kuruwita Central College (National School)" },
        // { name: "ROBO X EXPLORES", school: "R/EMB/President's College" }, ///
        // { name: "W.S.A.Randunu Bandara", school: "A/Thabuthegama National College" },
        // { name: "Smart Squad", school: "BT/BC Kathankudy Central College" },
        // { name: "SightSync", school: "Gateway College Dehiwala" },
        // { name: "Neos", school: "Visakha Vidyalaya" }, ///
        // { name: "Blacksheep", school: "Swarna Jayanthi National College" },
        // { name: "U.Luthmin Lesandu", school: "G/Dharmasoka College" },
        // { name: "The Innovation Hub", school: "St. Michael's College" },
        // { name: "BlitZ", school: "Gateway College Colombo" },
        { name: "Rover", school: "Wycherley International School-Gampaha" }, ///
        // { name: "Smart Deafblind Kit", school: "Nalanda College Colombo 10" },
        // { name: "SoloDev", school: "B/Bandarawela Central College" },
        // { name: "Robetics 2008", school: "J/Holy Family Convent" },
        // { name: "REAL_PROGRAMMER", school: "St. Joseph's College, Colombo 10" }, ///
        { name: "Quarista", school: "Royal College, Colombo 7" }, ///
        // { name: "Ocular Ds", school: "Senanayake College" },
        // { name: "Insight Seekers", school: "Rahula College Matara" },
        // { name: "GCC12", school: "Gateway College Colombo" }, ///
        // { name: "R.Pasindu Pinsara", school: "Urapola Central College" },
        // { name: "Mahinda College Galle", school: "Mahinda College Galle" },
        // { name: "Wellfocus", school: "Dr. Richard Pathirana College" },
        // { name: "Miyuru Sathsara (Leader)", school: "Sathsara MadhubahanaKa/Dhe/Ruwanwella Royal College" },
        // { name: "Batti Royal Kings", school: "Bt/Bt Methodist Central College" },
        { name: "Uro Tech", school: "H/Meegahawela K.V" }, ///
        // { name: "Crew X", school: "Nalanda College" },
        // { name: "Innovative Minders", school: "Mahinda Rajapaksha Maha Vidyalaya, Matara" },
        // { name: "DPN OF ROBOTECH", school: "H/Ambalantota N.S" },
        { name: "Team Trinity Syntax", school: "Trinity College Kandy" }, ///
        // { name: "LORD OF CODE", school: "AK/Munawwara Junior College" },
        // { name: "APCUTL", school: "Ak/Munawwara Junior College" },
        // { name: "Nexovate", school: "Mercy Education Institute" },
        // { name: "Smart Sense Innovators", school: "Mercy Education Institute" }, ///
        { name: "Senuka", school: "R/EMB/Bodhiraja College" }, ///
        { name: "Evolution", school: "Dharmapala College, Pannipitiya" }, ///
        // { name: "M.U.Yasir Umar", school: "Kattankudy Center College" },
        // { name: "Team Alpha", school: "Royal College Horana" },
        // { name: "TEAM ALPHA", school: "Mercy Education Institute" },
        // { name: "RCH IOT", school: "Royal College Horana" },
        // { name: "Pahan Methsara", school: "H/Therapuththa National School" },
        // { name: "Ahkam Tanjiro", school: "Zahira College Colombo" },
        // { name: "MediLink", school: "Ananda College" },
        { name: "Sentinel", school: "St. Joseph's College, Colombo 10" }, ///
        { name: "NeuroVerse", school: "Galahitiyawa Central College" }, ///
        // { name: "Go Jetters", school: "MR/Rahula College" },
        // { name: "I.C.T Ninjas of Sri Lanka", school: "J/Hartley College, Point Pedro" },
        // { name: "APOLA", school: "Zahira College" },
        // { name: "Lion King", school: "H/Therapuththa Primary School" },
        // { name: "Therapuththa", school: "H/Therapuththa National School" },
        // { name: "Richwolf", school: "G/Richmond College" }, ///
        // { name: "Cyber Storm", school: "Rahula College" },
        // { name: "Night Fire", school: "H/Therapuththa N.S" },
        // { name: "Little Star", school: "H/Weraketiya Rajapaksha Central" },
        // { name: "Innovate Infinity", school: "President's College - Kotte" },
        // { name: "Synapsnex", school: "Dharmaraja College Kandy" },
        // { name: "Monkey King", school: "Therapuththa" },
        // { name: "IRTS Inventions", school: "WP/HO/Mahinda Rajapaksha College" }, ///
        // { name: "Innovation Legends", school: "Zahira College Colombo 10" },
        { name: "Team NC", school: "Nalanda College, Colombo" }, ///
        // { name: "FuTech_Divers", school: "Sujatha Vidyalaya" },
        // { name: "EL FI", school: "Hanwella Rajasinghe Central College" },
        // { name: "Tech Wizards", school: "St. Joseph's College, Colombo 10" },
        // { name: "Blitz Falcon", school: "Debarawewa Janadhipathi" },
        // { name: "Sacred Heart Cc", school: "Sacred Heart Convent" },
        // { name: "Swimmers", school: "Richmond College" },
        // { name: "TEENBOYZ", school: "Mount Calvary" },
        // { name: "GRADE 8 HEAR1", school: "Sacred Heart Convent" },
        // { name: "SpotFinders", school: "Mahinda College" }, ///
        // { name: "HEARTIANCE RO", school: "Sacred Heart Convent" },
        // { name: "Sacred Heart Cc", school: "Sacred Heart Convent" },
        // { name: "Lion King", school: "Theraputtha Primary School" },
    ],
    university: [
      // // { name: "Phoenix Idea", school: "Sabaragamuwa University of Sri Lanka" },
      // { name: "Syntax Squad", school: "University of Moratuwa" }, ///
      { name: "Novanex", school: "University of Moratuwa" }, ///
      { name: "Dyson Sphere", school: "University of Moratuwa" }, ///
      // // { name: "Sparks", school: "Curtin University Colombo" },
      // // { name: "VERTEX", school: "University of Moratuwa" },
      // // { name: "IT Wolves", school: "SLIIT Northern Uni" },
      // // { name: "Voltix", school: "University Of Sri Jayewardenepura" },
      // // { name: "Team Conquerors", school: "University of Sri Jayewardenepura" },
      // // { name: "Innovative Guardians", school: "SLIIT Northern Uni" },
      // // { name: "Binovators", school: "General Sir John Kotelawala Defence University" },
      // // { name: "Team QuickSilver", school: "University of Sri Jayewardenepura" },
      // // { name: "CtrlShiftHack", school: "SLIIT" },
      // // { name: "FindSeat", school: "University of Kelaniya" },
      // // { name: "NextGen Innovators", school: "University of Moratuwa" },
      // // { name: "Circuit Breakers", school: "General Sir John Kotelawala Defence University" },
      // // { name: "VOYAGEFLOW", school: "University of Moratuwa" },
      // // { name: "GLEAMING QUINTET", school: "University of Ruhuna" },
      // // { name: "Team ZenNova", school: "Sabaragamuwa University of Sri Lanka" },
      // // { name: "Team Vitalis", school: "University of Sri Jayewardenepura" },
      // // { name: "Legendarymakers", school: "University of Moratuwa" },
      { name: "AgriGenix", school: "University of Moratuwa" }, ///
      { name: "Zypher", school: "University of Moratuwa" }, ///
      // // { name: "OrbisD", school: "Java Institute" },
      // // { name: "Team GLOW", school: "University of Moratuwa" },
      // // { name: "Trendy Troopers", school: "University of Moratuwa" },
      // // { name: "Neura Nexus", school: "University of Moratuwa" },
      // // { name: "ByteBandits", school: "University of Moratuwa" },
      // // { name: "Script Titan", school: "Sri Lanka Institute of Information Technology" },
      // // { name: "Team PillAid", school: "University of Moratuwa" },
      // // { name: "Secure Mesh", school: "University of Moratuwa" },
      // // { name: "Zephyrus", school: "University of Peradeniya" },
      // // { name: "HADES", school: "Java Institute of Advanced Technology" },
      // // { name: "Tech Titans", school: "University of Kelaniya" },
      // // { name: "TricalSpark", school: "University of Moratuwa" },
      // // { name: "InoveX", school: "University of Jaffna" },
      // // { name: "CloudCircuit", school: "University of Moratuwa" },
      // // { name: "NOVA_5", school: "Faculty of Engineering, University of Jaffna" },
      // // { name: "Astroyazhni", school: "American National College" },
      // // { name: "Nova", school: "University of Ruhuna" },
      // // { name: "RazorCrest", school: "University of Moratuwa" },
      // // { name: "Silicon", school: "University of Kelaniya" },
      // // { name: "Vertex", school: "University of Moratuwa" },
      // { name: "7X Labs", school: "University of Moratuwa" }, ///
      // // { name: "Q_Bee", school: "University of Ruhuna" },
      // { name: "TechVision", school: "University of Jaffna" }, ///
      // // { name: "Hydro Sense", school: "University of Moratuwa" },
      // // { name: "FutureSync", school: "University of Moratuwa" },
      // // { name: "Revolt", school: "University of Moratuwa" },
      // // { name: "Team JASPERN", school: "University of Moratuwa" },
      // { name: "AquaSmatters", school: "University of Ruhuna" }, ///
      // // { name: "Code Nexus", school: "University of Moratuwa" },
      // { name: "SyntaxCode", school: "University of Moratuwa" }, ///
      // // { name: "ERROR 404", school: "SLIIT" },
      { name: "Team EvoBots", school: "University of Moratuwa" }, ///
      // // { name: "Sensora", school: "Sabaragamuwa University of Sri Lanka" },
      // // { name: "DreamBuilders", school: "University of Sri Jayewardenepura" },
      // // { name: "Amor Developers Group", school: "Informatics Institute of Technology" },
      // // { name: "SwiftwindVentures", school: "National Institute of Business Management" },
      // // { name: "CripticHackers", school: "University of Jaffna" },
      // // { name: "Team RASPBerry", school: "Informatics Institute of Technology" },
      // // { name: "X-TEC", school: "University of Moratuwa" },
      // { name: "Spark Squad", school: "University of Moratuwa" }, ///
      // // { name: "RootQuarks", school: "Uva Wellassa University" },
      // // { name: "TechTronics", school: "Uva Wellassa University" },
      // // { name: "Byte_Me", school: "University of Moratuwa" },
      // // { name: "IOTRONS", school: "Rajarata University of Sri Lanka" },
      // { name: "Hydro Sense", school: "University of Kelaniya" }, ///
      { name: "Syntech-IoT", school: "University of Moratuwa" }, ///
      // // { name: "Tech Titans", school: "Sri Lanka Technology Campus (SLTC)" },
      // // { name: "StarkTech", school: "University of Moratuwa" },
      // // { name: "LogicLegion", school: "University of Jaffna" },
      // // { name: "p28 kaos tech", school: "SLIIT" },
      // // { name: "Sentinels", school: "UCSC" },
      // // { name: "zeus", school: "General Sir John Kotelawala Defence University" },
      // // { name: "WE5", school: "University of Moratuwa" },
      // // { name: "Circuit Crushers", school: "Rajarata University of Sri Lanka" },
      // // { name: "CINEC_MCT_404", school: "CINEC Campus Malabe" },
      // // { name: "PeerShip", school: "University of Moratuwa" },
      // // { name: "Iotelligence", school: "General Sir John Kotelawala Defence University" },
      // // { name: "Smart Grid", school: "IIT" },
      // // { name: "IOT Mavericks", school: "University of Moratuwa" },
      { name: "Ignitrix", school: "University of Moratuwa" }, ///
      // // { name: "Byte Blossoms", school: "University of Moratuwa" },
      { name: "SmartFlow", school: "SLIIT" }, ///
      // // { name: "SafeCy", school: "University of Moratuwa" },
      // // { name: "IoTrick", school: "University of Moratuwa" },
      // // { name: "WEENIOT", school: "University of Moratuwa" },
      // // { name: "TechNova", school: "National Institute of Business Management" },
      // // { name: "ByteForce", school: "University of Moratuwa" },
      // // { name: "Sync Wizards", school: "University of Jaffna" },
      // // { name: "LUMOS", school: "University of Moratuwa" },
      // // { name: "Mug Picco", school: "University of Moratuwa" },
      // // { name: "Team Novare", school: "University of Moratuwa" },
      // // { name: "TechnoFive", school: "University of Moratuwa" },
      { name: "AquaGuard", school: "University of Moratuwa" }, ///
      // // { name: "Zak Strom", school: "NSBM Green University" },
      // // { name: "SCOPE", school: "University of Moratuwa" },
      // { name: "The Sentinels", school: "University of Moratuwa" }, ///
      // { name: "Roboticca", school: "University of Colombo" }, ///
      { name: "PixaVisualz", school: "University of Moratuwa" }, ///
      // { name: "Trical Bots", school: "University of Moratuwa" }, ///
      // // { name: "Blue Circle", school: "University of Peradeniya" },
      // // { name: "DRAROSG", school: "University of Moratuwa" },
      // // { name: "Legendary Makers", school: "University of Moratuwa" },
      // // { name: "Smart Transit", school: "University of Kelaniya" },
      // // { name: "Bit Brigade", school: "University of Moratuwa" },
      // // { name: "FireEye", school: "University of Moratuwa" },
      // // { name: "ParkSphere", school: "University of Moratuwa" },
      // // { name: "Titan Force", school: "University of Moratuwa" },
      // // { name: "Power Spark", school: "University of Kelaniya" },
      // // { name: "Agri Nexters", school: "University of Moratuwa" },
    ],
    open: [
      { name: "wheelorbi", school: "Kalutara" }, ///
      { name: "SypherLink", school: "Kegalle" }, ////
      { name: "AURA", school: "Colombo" }, ////
      { name: "Synop", school: "Colombo" },  ///
      { name: "SmartCare", school: "Kalutara" }, ////
      // { name: "PlasticPals", school: "Polonnaruwa" }, ///
      { name: "TeraNode", school: "Galle" },  ////
      // { name: "Team Trojans", school: "Puttalam" }, ////
      { name: "Cloud99X", school: "Colombo" },  ///
      // { name: "StrydoLabs", school: "Puttalam" }, ////
      // { name: "AmpArts", school: "Kegalle" }, ////
      // { name: "RouteX", school: "Colombo" }, ///
      { name: "TechTanks", school: "Gampaha" } ///
    ]
  };

  const splitTeams = (teams) => {
    const mid = Math.ceil(teams.length / 2);
    return [teams.slice(0, mid), teams.slice(mid)];
  };

  return (
    <div className="max-w-7xl mx-auto p-5">
      <GuilineHeader />
      <motion.h2
          initial={{opacity:0, y:50}}
          whileInView={{opacity:1, y:0}}
          transition={{ duration: 1 }}
          className="mb-12 text-3xl font-bold text-center text-white md:text-4xl uppercase"
        >
          finalists
        </motion.h2>
      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'school' ? 'bg-[#393185] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          School Category
        </button>
        <button
          onClick={() => setActiveTab('university')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'university' ? 'bg-[#ff00a4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          University Category
        </button>
        <button
          onClick={() => setActiveTab('open')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'open' ? 'bg-[#2b0091] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Open Category
        </button>
      </div>

      {/* Teams Display - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams[activeTab].length > 0 ? splitTeams(teams[activeTab]).map((columnTeams, colIndex) => (
          <div key={colIndex} className="space-y-2">
            {columnTeams.map((team, index) => (
              <div key={index} className="flex flex-col md:flex-row items-stretch rounded overflow-hidden shadow-sm">
                <div 
                  className="md:w-2/5 w-full py-2 px-3 text-white font-medium text-sm text-center md:text-left"
                  style={{
                    backgroundColor: activeTab === 'school' ? '#393185' : 
                                  activeTab === 'university' ? '#ff00a4' : '#2b0091'
                  }}
                >
                  <div className="line-clamp-1 hover:line-clamp-none">{team.name}</div>
                </div>
                <div className="md:w-3/5 w-full py-2 px-3 bg-white">
                  <div className="text-gray-700 text-sm line-clamp-1 hover:line-clamp-none text-center md:text-left">
                    {team.school}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )) : (
          <div className="col-span-1 md:col-span-2 text-center py-6 text-gray-200">
            To be announced soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedTeams;
