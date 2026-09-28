import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import ContactUs from "../components/ContactUs";

const InnovationTour = () => {
    const locations = [
        { name: "Colombo" },
        { name: "Galle" },
        { name: "Kegalle" },
        { name: "Matara" },
        { name: "Kandy" },
        { name: "Kurunegala" },
    ];

    const objectives = [
        "Introduce school students, especially in rural areas, to the fundamentals of IoT through hands-on sessions.",
        "Promote and expand the SLIoT Challenge across all provinces.",
        "Inspire innovation, creativity, and entrepreneurship among students while bridging the digital divide between urban and rural communities.",
        "Strengthen collaboration between schools, universities, and industry partners.",
        "Increase national visibility for the SLIoT Challenge and enhance the brand presence of SLT Mobitel through islandwide engagement and media coverage.",
    ];

    const timeline = [
        { task: "Reaching out to the Ministry of Education" },
        { task: "Sending letters to school principals inviting them to participate" },
        { task: "Sending letters to possible-centered schools asking about the possibility of holding the workshops" },
        { task: "Awaiting replies from schools" },
        { task: "Confirming schools again via telephone calls or emails" },
        { task: "Planning proposed time window for the workshop series" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
            <Header />

      

            {/* Postponement Notice (visible first on mobile) */}
            <section className="w-full mt-40 md:mt-8 pt-4 md:pt-[4.75rem] px-4">
                <div className="container mx-auto max-w-xl sm:max-w-3xl">
                    <div className="bg-gradient-to-r from-red-600/15 to-red-500/15 backdrop-blur-lg rounded-3xl p-4 sm:p-6 md:p-8 border border-red-600/50 shadow-lg">
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-red-200 text-center font-semibold leading-tight">
                            🔴 All Innovation Tour sessions are postponed due to unavoidable circumstances. We apologize for the inconvenience. We encourage all participants to focus on their project proposals and upcoming sessions. Thank you for your understanding.
                        </p>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="min-h-[70vh] md:min-h-screen flex items-center justify-center pt-6 md:pt-[4.75rem] lg:pt-[5.25rem] px-4">
                <div className="container mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#46BC41] via-[#01688E] to-[#46BC41] mb-6 animate-gradient">
                            SLIoT Innovation Tour
                        </h1>
                        <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto">
                            An island-wide IoT & AI awareness program for school students
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href="#about"
                                className="group relative inline-flex h-14 overflow-hidden rounded-full p-[2px] focus:outline-none w-full sm:w-64"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#46BC41_0%,#01688E_50%,#46BC41_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 text-lg font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
                                    Explore the Tour
                                </span>
                            </a>
                            <a
                                href="/"
                                className="group relative inline-flex h-14 overflow-hidden rounded-full p-[2px] focus:outline-none w-full sm:w-64"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#01688E_0%,#46BC41_50%,#01688E_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 text-lg font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
                                    Join SLIoT Challenge
                                </span>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-12 text-center">
                            About the Innovation Tour
                        </h2>
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-slate-700/50 shadow-2xl">
                            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
                                The SLIoT Innovation Tour is an island-wide awareness and engagement program conducted alongside the SLIoT Challenge and SLIoT Labs initiatives.
                            </p>
                            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
                                The tour aims to create awareness among school students about the Internet of Things (IoT) and emerging technologies. We plan to guide students on how to use AI in their work, with particular emphasis on providing enhanced AI-related support for rural areas.
                            </p>
                            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
                                Through this initiative, we intend to conduct interactive one-day workshops introducing the fundamentals of IoT, its real-world applications, and entrepreneurial opportunities within this emerging field.
                            </p>
                            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                                The tour will also serve as a bridge between schools, universities, and industries, inspiring students to participate in the SLIoT Challenge and explore innovation-driven career paths.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Target Audience Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-slate-900/30 to-slate-800/30">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-12 text-center">
                            Target Audience
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-gradient-to-br from-[#46BC41]/20 to-[#01688E]/20 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 transform hover:scale-105 transition-all duration-300">
                                <div className="text-6xl mb-4">🎓</div>
                                <h3 className="text-2xl font-bold text-white mb-4">School Students</h3>
                                <p className="text-gray-300">Grades 9–13 across urban and rural areas in all provinces</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#01688E]/20 to-[#46BC41]/20 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 transform hover:scale-105 transition-all duration-300">
                                <div className="text-6xl mb-4">🔬</div>
                                <h3 className="text-2xl font-bold text-white mb-4">Science & Tech Enthusiasts</h3>
                                <p className="text-gray-300">Students interested in Science, Technology & Innovation</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#46BC41]/20 to-[#01688E]/20 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 transform hover:scale-105 transition-all duration-300">
                                <div className="text-6xl mb-4">🌍</div>
                                <h3 className="text-2xl font-bold text-white mb-4">Nationwide Coverage</h3>
                                <p className="text-gray-300">Special focus on rural areas and digital inclusion</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Workshop Experience Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-12 text-center">
                            Workshop Experience
                        </h2>
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-slate-700/50 shadow-2xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-gradient-to-r from-[#46BC41] to-[#01688E] rounded-full p-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-semibold text-white">One-day workshop (5–6 hours)</p>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
                                <p className="text-lg text-yellow-200 font-semibold flex items-center gap-2">
                                    <span className="text-2xl">📍</span>
                                    All workshops will be conducted at SLT-MOBITEL Regional Offices
                                </p>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#46BC41] to-[#01688E] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">Introductory Session</h4>
                                        <p className="text-gray-300">A general lecture introducing the fundamentals of IoT, AI, and entrepreneurship in a simple and accessible manner for all participants.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#01688E] to-[#46BC41] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">Hands-on Practical Session</h4>
                                        <p className="text-gray-300">Students will be divided into groups for hands-on activities using IoT kits. (Practical kits will be required)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-[#46BC41]/10 to-[#01688E]/10 rounded-xl p-6 border border-[#46BC41]/30">
                                <p className="text-lg text-white flex items-center gap-2">
                                    <span className="text-2xl">🎁</span>
                                    Outstanding participants will be recognized with gifts for top individual and group performance, to encourage active participation.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Objectives & Impact Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-slate-900/30 to-slate-800/30">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-12 text-center">
                            Objectives & Impact
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {objectives.map((objective, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:border-[#46BC41]/50 transition-all duration-300"
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#46BC41] to-[#01688E] rounded-full flex items-center justify-center text-white font-bold">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-300 leading-relaxed">{objective}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Island-Wide Tour Locations Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-12 text-center">
                            Island-Wide Tour Locations
                        </h2>
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-slate-700/50 shadow-2xl mb-8">
                            <p className="text-xl text-center text-gray-300 mb-4">
                                Workshops hosted at <span className="text-[#46BC41] font-bold">SLT-MOBITEL Regional Offices</span>
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {locations.map((location, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-gradient-to-br from-[#46BC41]/20 to-[#01688E]/20 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 text-center hover:scale-105 transition-all duration-300"
                                >
                                    <div className="text-4xl mb-4">📍</div>
                                    <h3 className="text-xl font-bold text-white mb-2">{location.name}</h3>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Resource Team & Materials Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-slate-900/30 to-slate-800/30">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-12 text-center">
                            Resource Team & Materials
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
                                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="text-3xl">👥</span>
                                    Resource Personnel
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#46BC41] text-xl">✓</span>
                                        <span className="text-gray-300">University of Moratuwa undergraduates from the SLIoT organizing team and CSE department</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#46BC41] text-xl">✓</span>
                                        <span className="text-gray-300">Mentors & Coordinators from SLT-MOBITEL and Computer Science & Engineering Department</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#46BC41] text-xl">✓</span>
                                        <span className="text-gray-300">Guest speakers from the technology industry</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
                                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="text-3xl">📦</span>
                                    Resource Materials
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#46BC41] text-xl">✓</span>
                                        <span className="text-gray-300">SLIoT Resource Kits: Basic IoT components and microcontrollers</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#46BC41] text-xl">✓</span>
                                        <span className="text-gray-300">Printed/Soft Learning Materials: Booklets and digital guides introducing IoT basics</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#46BC41] text-xl">✓</span>
                                        <span className="text-gray-300">Multimedia Support: Presentation slides and demonstration videos</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

        
        

            {/* Call to Action Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-slate-900/30 to-slate-800/30">
                <div className="container mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-12">
                            Get Involved
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <a
                                href="#contact"
                                className="group relative inline-flex h-16 overflow-hidden rounded-full p-[2px] focus:outline-none w-full sm:w-72"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#46BC41_0%,#01688E_50%,#46BC41_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 text-lg font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
                                    Register Your School
                                </span>
                            </a>
                            <a
                                href="#contact"
                                className="group relative inline-flex h-16 overflow-hidden rounded-full p-[2px] focus:outline-none w-full sm:w-72"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#01688E_0%,#46BC41_50%,#01688E_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 text-lg font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
                                    Become a Partner
                                </span>
                            </a>
                            <a
                                href="/"
                                className="group relative inline-flex h-16 overflow-hidden rounded-full p-[2px] focus:outline-none w-full sm:w-72"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#46BC41_0%,#01688E_50%,#46BC41_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 text-lg font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
                                    Join SLIoT Challenge
                                </span>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Contact Details Section */}
            <ContactUs />

            <Footer />
        </div>
    );
};

export default InnovationTour;
