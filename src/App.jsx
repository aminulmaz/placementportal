import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDC7FjteRHLZ8DceDjgzSMD3BEV7IM-hHw",
  authDomain: "mzrschool-4457d.firebaseapp.com",
  projectId: "mzrschool-4457d",
  storageBucket: "mzrschool-4457d.firebasestorage.app",
  messagingSenderId: "107673442985",
  appId: "1:107673442985:web:1b188336bc04adbf9f27b8"
};

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- SVG ICONS ---
const LoaderIcon = ({ className = "h-5 w-5 text-white" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const BriefcaseIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const BuildingOfficeIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 4h5m-5 4h5m-5 4h5M9 3l-3 3m0 0l3 3m-3-3h12" /></svg>);
const UserIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const PlusIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const DocumentTextIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>);
const XMarkIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

// --- CUSTOM MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('login'); // login, signup
    const [showRolePrompt, setShowRolePrompt] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
                setUser(currentUser);
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                setGoogleUser(user);
                setShowRolePrompt(true);
            } else {
                setUserData(userDoc.data());
                setUser(user);
            }
        } catch (error) {
            setError(error.message);
        }
    };
    
    const handleRoleSelection = async (role) => {
        if (!googleUser) return;
        if (['student', 'company'].includes(role)) {
            await setDoc(doc(db, "users", googleUser.uid), {
                email: googleUser.email,
                role: role,
                name: googleUser.displayName,
                uid: googleUser.uid
            });
            const newUserDoc = await getDoc(doc(db, "users", googleUser.uid));
            setUserData(newUserDoc.data());
            setUser(googleUser);
            setShowRolePrompt(false);
            setGoogleUser(null);
        } else {
            showNotification("Invalid role selected.", "error");
        }
    };


    const handleSignOut = async () => {
        await signOut(auth);
        setView('login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <LoaderIcon className="w-12 h-12 text-blue-600"/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
             <Notification {...notification} />
             <Modal isOpen={showRolePrompt} onClose={() => setShowRolePrompt(false)} title="Select Your Role">
                <p className="mb-4 text-gray-600">To complete your registration, please select your role in the portal.</p>
                <div className="flex justify-around">
                    <button onClick={() => handleRoleSelection('student')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Student</button>
                    <button onClick={() => handleRoleSelection('company')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Company</button>
                </div>
            </Modal>
            
            {!user || !userData ? (
                <AuthScreen
                    view={view}
                    setView={setView}
                    setError={setError}
                    error={error}
                    handleGoogleSignIn={handleGoogleSignIn}
                    showNotification={showNotification}
                />
            ) : (
                <DashboardLayout userData={userData} handleSignOut={handleSignOut}>
                    {userData.role === 'student' && <StudentDashboard user={user} userData={userData} showNotification={showNotification} />}
                    {userData.role === 'company' && <CompanyDashboard user={user} userData={userData} showNotification={showNotification} />}
                    {userData.role === 'admin' && <AdminDashboard showNotification={showNotification} />}
                </DashboardLayout>
            )}
        </div>
    );
}

// --- DASHBOARD LAYOUT ---
const DashboardLayout = ({ userData, handleSignOut, children }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* This is where a sidebar would go if we expand further. For now, it's a simple layout. */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                                <span className="font-bold text-xl ml-2 text-gray-800">Placement Portal</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-600 mr-4 hidden sm:block">
                                    Welcome, <span className="font-semibold">{userData.name || userData.email}</span>
                                </span>
                                <button
                                    onClick={handleSignOut}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-150"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ view, setView, error, setError, handleGoogleSignIn, showNotification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!name && view === 'signup') {
            setError("Please enter your full name.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), { uid: user.uid, email, role, name });
            showNotification("Account created successfully!", "success");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
             <div className="max-w-md w-full mx-auto bg-white p-8 border border-gray-200 rounded-2xl shadow-lg">
                <div className="text-center mb-8">
                    <BriefcaseIcon className="mx-auto h-12 w-12 text-blue-600"/>
                    <h1 className="text-3xl font-bold text-gray-800 mt-2">Placement Portal</h1>
                    <p className="text-gray-500">{view === 'login' ? 'Welcome back!' : 'Create your account'}</p>
                </div>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center text-sm">{error}</p>}
                
                <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
                     {view === 'signup' && (
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" required />
                        </div>
                    )}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@college.edu" required/>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="******************" required />
                    </div>

                    {view === 'signup' && (
                        <div>
                             <label className="block text-gray-700 text-sm font-bold mb-2">I am a...</label>
                             <div className="flex rounded-lg border border-gray-200 p-1">
                                <button type="button" onClick={() => setRole('student')} className={`w-full text-center py-2 rounded-md transition-colors ${role === 'student' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>Student</button>
                                <button type="button" onClick={() => setRole('company')} className={`w-full text-center py-2 rounded-md transition-colors ${role === 'company' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>Company</button>
                             </div>
                        </div>
                    )}
                    
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 flex items-center justify-center disabled:bg-blue-400">
                        {loading ? <LoaderIcon /> : (view === 'login' ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div></div>
                
                <button onClick={handleGoogleSignIn} className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.35 6.48C12.73 13.72 17.93 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.96 7.21l7.45 5.72C44.77 35.9 46.98 30.61 46.98 24.55z"></path><path fill="#FBBC05" d="M10.91 28.7A14.99 14.99 0 0 1 9.82 24c0-1.48.21-2.91.59-4.28l-8.35-6.48A24.008 24.008 0 0 0 0 24c0 4.52 1.24 8.68 3.37 12.12l7.54-5.42z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.45-5.72c-2.11 1.42-4.79 2.26-7.94 2.26-6.07 0-11.27-4.22-13.09-9.98l-8.35 6.48C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                        Google
                </button>

                <p className="text-center text-gray-500 text-sm mt-6">
                    {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); }} className="font-bold text-blue-600 hover:text-blue-700 ml-1">
                        {view === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>
             </div>
        </div>
    );
};

// --- NOTIFICATION COMPONENT ---
const Notification = ({ show, message, type }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div className={`fixed top-5 right-5 z-50 p-4 rounded-md text-white ${bgColor} shadow-lg`}>
                {message}
            </div>
        </Transition>
    );
};


// --- STUDENT DASHBOARD ---
const StudentDashboard = ({ user, userData, showNotification }) => {
    const [page, setPage] = useState('jobs'); // jobs, applications, profile
    
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
                <div className="bg-white rounded-lg p-1 shadow-sm border">
                    <button onClick={() => setPage('jobs')} className={`px-4 py-2 text-sm font-medium rounded-md ${page === 'jobs' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Available Jobs</button>
                    <button onClick={() => setPage('applications')} className={`px-4 py-2 text-sm font-medium rounded-md ${page === 'applications' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>My Applications</button>
                    <button onClick={() => setPage('profile')} className={`px-4 py-2 text-sm font-medium rounded-md ${page === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>My Profile</button>
                </div>
            </div>
            {page === 'jobs' && <JobListings user={user} userData={userData} showNotification={showNotification} />}
            {page === 'applications' && <StudentApplications user={user} />}
            {page === 'profile' && <StudentProfile user={user} userData={userData} showNotification={showNotification} />}
        </div>
    );
};

// ... (Rest of Student components, Company, Admin, etc.)
const StudentProfile = ({ user, userData, showNotification }) => {
    const [profile, setProfile] = useState({ name: '', email: '', branch: '', cgpa: '', skills: '', resumeUrl: '' });
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        const profileDoc = await getDoc(doc(db, "studentProfiles", user.uid));
        if (profileDoc.exists()) {
            setProfile(profileDoc.data());
        } else {
            setProfile({ name: userData.name, email: userData.email, branch: '', cgpa: '', skills: '', resumeUrl: '' });
        }
        setLoading(false);
    }, [user.uid, userData.name, userData.email]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, "studentProfiles", user.uid), profile, { merge: true });
            showNotification("Profile updated successfully!", "success");
        } catch (error) {
            showNotification(`Error: ${error.message}`, "error");
        }
    };
    
    if (loading) return <p>Loading profile...</p>;

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Profile</h2>
            <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Full Name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                    <input className="p-3 border rounded-lg bg-gray-100 cursor-not-allowed" placeholder="Email" value={profile.email} disabled />
                    <input className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Branch (e.g., Computer Science)" value={profile.branch} onChange={e => setProfile({...profile, branch: e.target.value})} />
                    <input type="number" step="0.01" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="CGPA (e.g., 8.5)" value={profile.cgpa} onChange={e => setProfile({...profile, cgpa: e.target.value})} />
                    <input className="p-3 border rounded-lg col-span-1 md:col-span-2 focus:ring-2 focus:ring-blue-500" placeholder="Skills (comma separated, e.g., React, Node.js, Python)" value={profile.skills} onChange={e => setProfile({...profile, skills: e.target.value})} />
                    <input className="p-3 border rounded-lg col-span-1 md:col-span-2 focus:ring-2 focus:ring-blue-500" placeholder="Resume URL (Google Drive, Dropbox, etc.)" value={profile.resumeUrl} onChange={e => setProfile({...profile, resumeUrl: e.target.value})} />
                </div>
                <button type="submit" className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Profile</button>
            </form>
        </div>
    );
};

const JobListings = ({ user, showNotification }) => {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const profileDoc = await getDoc(doc(db, "studentProfiles", user.uid));
        setProfile(profileDoc.exists() ? profileDoc.data() : null);

        const jobsSnapshot = await getDocs(query(collection(db, "jobs"), orderBy("postedAt", "desc")));
        setJobs(jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const q = query(collection(db, "applications"), where("studentId", "==", user.uid));
        const appsSnapshot = await getDocs(q);
        setApplications(appsSnapshot.docs.map(doc => doc.data().jobId));
        setLoading(false);
    }, [user.uid]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApply = async (job) => {
        if (applications.includes(job.id)) {
            showNotification("You have already applied for this job.", "error");
            return;
        }
        if(!profile?.branch || !profile?.cgpa || !profile?.resumeUrl) {
            showNotification("Please complete your profile before applying.", "error");
            return;
        }
        try {
            await addDoc(collection(db, "applications"), {
                jobId: job.id,
                jobTitle: job.title,
                companyName: job.companyName,
                studentId: user.uid,
                studentName: profile.name,
                appliedAt: serverTimestamp(),
                status: 'Applied'
            });
            setApplications([...applications, job.id]);
            showNotification("Applied successfully!", "success");
        } catch(error) {
            showNotification(`Error: ${error.message}`, "error");
        }
    };
    
    if (loading) return <p>Loading jobs...</p>
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length > 0 ? jobs.map(job => (
                <div key={job.id} className="bg-white p-5 rounded-lg shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                        <p className="text-gray-600 flex items-center mt-1"><BuildingOfficeIcon className="w-4 h-4 mr-2"/>{job.companyName}</p>
                        <p className="text-gray-500 text-sm mt-3">{job.description}</p>
                        <p className="text-sm mt-4"><span className="font-semibold">Location:</span> {job.location}</p>
                        <p className="text-sm"><span className="font-semibold">Salary:</span> {job.salary}</p>
                    </div>
                    <button onClick={() => handleApply(job)} disabled={applications.includes(job.id)}
                        className={`w-full mt-4 py-2 rounded-lg font-semibold transition-colors ${applications.includes(job.id) ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:cursor-not-allowed disabled:bg-gray-400`}
                    >
                        {applications.includes(job.id) ? 'Applied' : 'Apply Now'}
                    </button>
                </div>
            )) : <p className="col-span-full">No jobs posted yet.</p>}
        </div>
    );
};

const StudentApplications = ({ user }) => {
    const [myApps, setMyApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            const q = query(collection(db, "applications"), where("studentId", "==", user.uid), orderBy("appliedAt", "desc"));
            const snapshot = await getDocs(q);
            setMyApps(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
            setLoading(false);
        }
        fetchApps();
    }, [user.uid]);
    
    if (loading) return <p>Loading applications...</p>;
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'Applied': return 'bg-blue-100 text-blue-800';
            case 'Shortlisted': return 'bg-yellow-100 text-yellow-800';
            case 'Accepted': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h2>
            <div className="space-y-4">
                {myApps.length > 0 ? myApps.map(app => (
                    <div key={app.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold">{app.jobTitle}</p>
                            <p className="text-sm text-gray-600">{app.companyName}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(app.status)}`}>
                            {app.status}
                        </span>
                    </div>
                )) : <p>You haven't applied to any jobs yet.</p>}
            </div>
        </div>
    );
};


// --- COMPANY DASHBOARD ---
const CompanyDashboard = ({ user, userData, showNotification }) => {
    const [page, setPage] = useState('jobs'); // jobs, post, profile
    
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Company Dashboard</h1>
                <div className="bg-white rounded-lg p-1 shadow-sm border">
                    <button onClick={() => setPage('jobs')} className={`px-4 py-2 text-sm font-medium rounded-md ${page === 'jobs' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>My Postings</button>
                    <button onClick={() => setPage('post')} className={`px-4 py-2 text-sm font-medium rounded-md ${page === 'post' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Post a Job</button>
                </div>
            </div>
            {page === 'jobs' && <CompanyJobs user={user} showNotification={showNotification}/>}
            {page === 'post' && <PostJobForm user={user} userData={userData} showNotification={showNotification} setPage={setPage}/>}
        </div>
    )
};

const PostJobForm = ({ user, userData, showNotification, setPage }) => {
    const [job, setJob] = useState({ title: '', description: '', location: '', salary: '' });

    const handlePostJob = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "jobs"), {
                ...job,
                companyId: user.uid,
                companyName: userData.name,
                postedAt: serverTimestamp()
            });
            setJob({ title: '', description: '', location: '', salary: '' });
            showNotification("Job posted successfully!", "success");
            setPage('jobs');
        } catch (error) {
            showNotification(`Error: ${error.message}`, "error");
        }
    };
    
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Post a New Job</h2>
            <form onSubmit={handlePostJob}>
                <div className="space-y-4">
                    <input className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500" placeholder="Job Title" value={job.title} onChange={e => setJob({...job, title: e.target.value})} required/>
                    <textarea className="p-3 border rounded-lg w-full h-32 focus:ring-2 focus:ring-blue-500" placeholder="Job Description" value={job.description} onChange={e => setJob({...job, description: e.target.value})} required></textarea>
                    <input className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500" placeholder="Location (e.g., Remote, City)" value={job.location} onChange={e => setJob({...job, location: e.target.value})} required/>
                    <input className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500" placeholder="Salary/Stipend" value={job.salary} onChange={e => setJob({...job, salary: e.target.value})} required/>
                </div>
                <button type="submit" className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Post Job</button>
            </form>
        </div>
    )
}

const CompanyJobs = ({user, showNotification}) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const q = query(collection(db, "jobs"), where("companyId", "==", user.uid), orderBy("postedAt", "desc"));
        const snapshot = await getDocs(q);
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, [user.uid]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);
    
    if (loading) return <p>Loading job postings...</p>;
    if (selectedJob) return <ViewApplicants job={selectedJob} setSelectedJob={setSelectedJob} showNotification={showNotification}/>

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Job Postings</h2>
            <div className="space-y-4">
                {jobs.length > 0 ? jobs.map(job => (
                    <div key={job.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">{job.title}</p>
                            <p className="text-sm text-gray-600">{job.location}</p>
                        </div>
                        <button onClick={() => setSelectedJob(job)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">View Applicants</button>
                    </div>
                )) : <p>You haven't posted any jobs yet.</p>}
            </div>
        </div>
    );
};

const ViewApplicants = ({ job, setSelectedJob, showNotification }) => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplicants = async () => {
            setLoading(true);
            const q = query(collection(db, "applications"), where("jobId", "==", job.id));
            const snapshot = await getDocs(q);
            
            const appData = await Promise.all(snapshot.docs.map(async (appDoc) => {
                const studentProfile = await getDoc(doc(db, "studentProfiles", appDoc.data().studentId));
                return {
                    appId: appDoc.id,
                    ...appDoc.data(),
                    profile: studentProfile.exists() ? studentProfile.data() : null
                }
            }));
            setApplicants(appData);
            setLoading(false);
        };
        fetchApplicants();
    }, [job.id]);
    
    const updateStatus = async (appId, status) => {
        try {
            await updateDoc(doc(db, "applications", appId), { status: status });
            setApplicants(applicants.map(app => app.appId === appId ? {...app, status: status} : app));
            showNotification("Status updated!", "success");
        } catch(error){
            showNotification(`Error: ${error.message}`, "error");
        }
    };
    
    if(loading) return <p>Loading applicants...</p>;

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <button onClick={() => setSelectedJob(null)} className="text-blue-600 font-semibold mb-4">&larr; Back to Jobs</button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Applicants for {job.title}</h2>
            <div className="space-y-4">
                {applicants.length > 0 ? applicants.map(app => (
                    <div key={app.appId} className="border p-4 rounded-lg">
                        <p><strong>Name:</strong> {app.studentName}</p>
                        {app.profile && (
                            <>
                                <p><strong>Branch:</strong> {app.profile.branch}</p>
                                <p><strong>CGPA:</strong> {app.profile.cgpa}</p>
                                <a href={app.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
                            </>
                        )}
                        <div className="mt-2">
                            <strong>Status: </strong>
                            <select value={app.status} onChange={(e) => updateStatus(app.appId, e.target.value)} className="p-1 border rounded">
                                <option>Applied</option>
                                <option>Shortlisted</option>
                                <option>Accepted</option>
                                <option>Rejected</option>
                            </select>
                        </div>
                    </div>
                )) : <p>No one has applied for this job yet.</p>}
            </div>
        </div>
    );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard = ({ showNotification }) => {
     const [page, setPage] = useState('users'); // users, jobs
    
    return (
        <div>
             <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <div className="bg-white rounded-lg p-1 shadow-sm border">
                    <button onClick={() => setPage('users')} className={`px-4 py-2 text-sm font-medium rounded-md ${page === 'users' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Manage Users</button>
                    <button onClick={() => setPage('jobs')} className={`px-4 py-2 text-sm font-medium rounded-md ${page === 'jobs' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Manage Jobs</button>
                </div>
            </div>
            {page === 'users' && <ManageUsers showNotification={showNotification} />}
            {page === 'jobs' && <ManageJobs showNotification={showNotification}/>}
        </div>
    )
};

const ManageUsers = ({ showNotification }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const deleteUser = async (userId) => {
        if (!window.confirm("Delete user? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "users", userId));
            // You would use a Cloud Function to delete the auth user.
            showNotification("User record deleted.", "success");
            fetchData();
        } catch (error) {
            showNotification(`Error: ${error.message}`, "error");
        }
    }
    
    if (loading) return <p>Loading users...</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Manage Users ({users.length})</h2>
            <div className="max-h-96 overflow-y-auto space-y-2">
                {users.map(user => (
                    <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                            <p className="font-semibold">{user.name} ({user.role})</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    )
};

const ManageJobs = ({ showNotification }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

     const fetchData = useCallback(async () => {
        setLoading(true);
        const jobsSnapshot = await getDocs(collection(db, "jobs"));
        setJobs(jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const deleteJob = async (jobId) => {
        if (!window.confirm("Delete this job posting?")) return;
        try {
            await deleteDoc(doc(db, "jobs", jobId));
            showNotification("Job deleted.", "success");
            fetchData();
        } catch (error) {
            showNotification(`Error: ${error.message}`, "error");
        }
    };
    
     if (loading) return <p>Loading jobs...</p>;

    return (
         <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Manage Jobs ({jobs.length})</h2>
            <div className="max-h-96 overflow-y-auto space-y-2">
                {jobs.map(job => (
                    <div key={job.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                            <p className="font-semibold">{job.title}</p>
                            <p className="text-sm text-gray-500">{job.companyName}</p>
                        </div>
                        <button onClick={() => deleteJob(job.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    )
};

