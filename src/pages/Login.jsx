import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function Login() {
  const [activeTab, setActiveTab] = useState('member'); // 'member' or 'staff'
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, loginWithPhone, setupRecaptcha, currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentUser && userData) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (userData.role === 'admin') navigate('/admin');
        else if (userData.role === 'volunteer') navigate('/volunteer');
        else navigate('/member');
      }
    }
  }, [currentUser, userData, navigate, location]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const appVerifier = setupRecaptcha('recaptcha-container');
      const confirmation = await loginWithPhone(phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to send OTP. Ensure phone number is valid (+91...).');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Check if user document exists, if not create one for member
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          phone: user.phoneNumber,
          role: 'member',
          createdAt: serverTimestamp(),
          name: '',
          age: null,
          address: ''
        });
      }
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Invalid OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary p-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Sahayam</h1>
          <p className="text-blue-100">Community Help Portal</p>
        </div>
        
        <div className="flex border-b">
          <button 
            className={`flex-1 py-3 text-lg font-semibold ${activeTab === 'member' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('member')}
          >
            Citizen Login
          </button>
          <button 
            className={`flex-1 py-3 text-lg font-semibold ${activeTab === 'staff' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff Login
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'member' ? (
            <div>
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-lg"
                      placeholder="+919876543210"
                      required
                    />
                  </div>
                  <div id="recaptcha-container"></div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-lg text-center tracking-widest"
                      placeholder="XXXXXX"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-success text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setConfirmationResult(null)}
                    className="w-full text-primary mt-2 font-medium"
                  >
                    Use a different number
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="admin@sahayam.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
