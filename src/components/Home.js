import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Switch, Card, Row, Col, Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import {
  FiMenu, FiHome, FiFileText, FiSettings,
  FiCheckCircle, FiAlertTriangle, FiDollarSign
} from "react-icons/fi";
import axios from "axios";
import "../styles/Home.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

import { useTranslation } from "react-i18next";
import { FaCommentDots } from "react-icons/fa";



import {
  FaGavel,
  FaBalanceScale,
  FaUserShield,
  FaUserCircle,
  FaUsersCog,
  FaHome,
  FaFolderOpen,
  FaBars,
} from "react-icons/fa";





const Home = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState({ title: "", description: "", due_date: "" });
  const [userQuery, setUserQuery] = useState("");
const [messages, setMessages] = useState([]);
const [imageUrl, setImageUrl] = useState("");
const [isChatOpen, setIsChatOpen] = useState(false);

const toggleChat = () => setIsChatOpen(prev => !prev);

  const [recentOrders, setRecentOrders] = useState([
    { title: "Install New Transformer", department: "Work Execution Department", status: "Completed" },
    { title: "Cable Replacement", department: "Survey Department", status: "Pending" },
    { title: "Safety Inspection", department: "Safety Department", status: "Ongoing" }
  ]);
  const [chartData, setChartData] = useState([
    { name: "Work Receiving", projects: 15 },
    { name: "Survey", projects: 10 },
    { name: "Execution", projects: 20 },
  ]);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.body.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };
  const [currentUser, setCurrentUser] = useState("Guest");
  const [userName, setUser] = useState("Guest");

  useEffect(() => {
    axios.get("https://lawproject-production.up.railway.app/api/users")
      .then((res) => {
        if (res.data.length > 0) {
         const latestUser = res.data[res.data.length - 1]; // Get the last user added
          setCurrentUser(latestUser.username || "Unknown User");
          setUser(latestUser.name || "Unknown");
        } else {
          setCurrentUser("Guest");
          setUser("Unknown User")
        }
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setCurrentUser("Guest");
      });
  }, []);
  
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [statsRes, ordersRes, chartStatsRes, usersRes] = await Promise.all([
          axios.get("https://lawproject-production.up.railway.app/api/stats"),
          axios.get("https://lawproject-production.up.railway.app/api/recent-work-orders"),
          axios.get("https://lawproject-production.up.railway.app/api/chart-stats"),
          axios.get("https://lawproject-production.up.railway.app/api/users"), // Optional if you want users
        ]);
  
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data);
  
        const stats = chartStatsRes.data;
        const formattedChartData = [
          { name: "Work Receiving", projects: stats.work_receiving },
          { name: "Emergency & Maintainence", projects: stats.emergency_and_maintainence },
          { name: "Survey", projects: stats.survey },
          { name: "Permission", projects: stats.permissions },
          { name: "Safety", projects: stats.safety },
          { name: "Work Execution", projects: stats.work_execution },
          { name: "Laboratory", projects: stats.lab },
          { name: "Permission Closing", projects: stats.permission_closing },
          { name: "Work Closing", projects: stats.work_closing },
          { name: "Invoice", projects: stats.invoice },
          { name: "Drawing", projects: stats.drawing },
          { name: "GIS", projects: stats.gis },
          { name: "Store", projects: stats.store },
        ];
        setChartData(formattedChartData);
  
        // If you want to display users
        // setUsers(usersRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchAllData();
  }, []);
  // const handleTextGuidance = async () => {
  //   if (!userQuery.trim()) return;
  
  //   setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
  
  //   try {
  //     const response = await axios.post('https://vivacious-encouragement-production-c947.up.railway.app/generate_text', {
  //       text: `Format this response clearly and professionally for legal purposes. Use sections, bullet points if needed, and bold headers. Write in formal English. Task: ${userQuery}`,
  //     });
  
  //     setMessages(prev => [
  //       ...prev,
  //       { sender: 'ai', text: response.data.generated_text },
  //     ]);
  //   } catch (error) {
  //     console.error('Error getting guidance:', error);
  //     setMessages(prev => [
  //       ...prev,
  //       { sender: 'ai', text: 'Sorry, an error occurred. Please try again.' },
  //     ]);
  //   }
  
  //   setUserQuery('');
  // };
  const handleTextGuidance = async () => {
  if (!userQuery.trim()) return;

  setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);

  try {
    const isLegalQuery = userQuery.toLowerCase().includes("case") ||
                         userQuery.toLowerCase().includes("court") ||
                         userQuery.toLowerCase().includes("judge");

    const endpoint = isLegalQuery 
      ? 'https://your-server.com/ask_case_ai'
      : 'https://your-server.com/generate_text';

    const payload = isLegalQuery
      ? { question: userQuery, case_num: null }
      : { text: userQuery };

    const response = await axios.post(endpoint, payload);

    setMessages(prev => [
      ...prev,
      { sender: 'ai', text: response.data.generated_text },
    ]);
  } catch (error) {
    console.error('Error getting guidance:', error);
    setMessages(prev => [
      ...prev,
      { sender: 'ai', text: 'Sorry, an error occurred. Please try again.' },
    ]);
  }

  setUserQuery('');
};

  
  const handleImageGeneration = async () => {
    if (!userQuery.trim()) return;
  
    try {
      const response = await axios.post('https://vivacious-encouragement-production-c947.up.railway.app/generate_image', {
        prompt: userQuery,
      });
  
      if (response.data.image_url) {
        setImageUrl(response.data.image_url);
      } else {
        console.error('No image generated');
      }
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };
  

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
  }, [darkMode]);

 
  function isValidDate(date) {
    return date && !isNaN(new Date(date).getTime());
  }
  useEffect(() => {
    axios.get("https://lawproject-production.up.railway.app/api/todos").then(res => setTodos(res.data));
  }, []);

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   axios.post("https://lawproject-production.up.railway.app/api/todos", formData).then(() => {
  //     setFormData({ title: "", description: "", due_date: "" });
  //     return axios.get("https://lawproject-production.up.railway.app/api/todos");
  //   }).then(res => setTodos(res.data));
  // };
  const [showForm, setShowForm] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);
  const calendarRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [reminders, setReminders] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  

  const handleDatesSet = () => {
    const dayCells = document.querySelectorAll('.fc-daygrid-day');

    dayCells.forEach((cell) => {
      // Prevent duplicate listeners
      cell.removeEventListener('dblclick', handleDoubleClick);
      cell.addEventListener('dblclick', handleDoubleClick);
    });
  };

  const [formType, setFormType] = useState('reminder'); // "reminder" or "todo"
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    axios.get("https://lawproject-production.up.railway.app/api/recent-cases")
      .then((res) => setRecentCases(res.data))
      .catch((err) => console.error("Error fetching recent cases:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const newEntry = {
      title: formData.title,
      description: formData.description,
      due_date: selectedDate,
    };
  
    if (formType === 'todo') {
      try {
        const response = await axios.post('https://lawproject-production.up.railway.app/api/todos', newEntry);
        console.log('To-do saved:', response.data);
      } catch (error) {
        console.error('Error saving to-do:', error);
      }
    } else {
      const newReminder = {
        id: Date.now(),
        title: formData.title,
        description: formData.description,
        date: selectedDate,
      };
      setReminders([...reminders, newReminder]);
    }
  
    setFormData({ title: '', description: '' });
    setShowForm(false);
  };
  useEffect(() => {
    axios.get('https://lawproject-production.up.railway.app/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to fetch stats', err));
  }, []);
  
  const handleDoubleClick = (e) => {
    const cell = e.currentTarget;
    const date = cell.getAttribute('data-date');
    if (date) {
      setSelectedDate(date);
      setShowForm(true);
    }
  }
  return (
    <>
      <div className={`home-container ${darkMode ? "dark" : "light"}`}>
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
  <div className="logo">
    <h2><FaBalanceScale /> Law Admin</h2>
    <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
      <FaBars />
    </button>
  </div>

  <div className="user-info">
    <FaUserCircle size={20} style={{ marginRight: 6 }} />
    <span style={{ fontWeight: 'bold', color: 'rgb(131, 167, 99)' }}>
      Logged in as: <strong>{currentUser}</strong>
    </span>
  </div>

  {/* Scrollable content */}
  <div className="nav-container">
    <nav className="nav-links">
      <p onClick={() => navigate("/")}><FaHome /> Home</p>
      <p onClick={() => navigate("/Departments/work-receiving-department")}><FaFolderOpen /> Add New Case</p>
      <p onClick={() => navigate("/management")}><FaGavel /> Detail of Cases</p>
      <p onClick={() => navigate("/users")}><FaUsersCog /> Details of Clients</p>
      {/* <p onClick={() => navigate("/users")}><FaUsersCog /> Details of Judges</p> */}
    </nav>
  </div>

  {/* Fixed bottom links */}
  <div className="bottom-links">
    <p onClick={() => navigate("/settings")}><FaUsersCog /> Setting</p>
    <p onClick={() => navigate("/logout")}><FaUsersCog /> Log Out</p>
  </div>
</aside>


        <div className="main-content">
  {/* Header */}
  <section className="top-section">
  <div className="search-bar">
    <TextField
      label="Search"
      variant="outlined"
      fullWidth
      size="small"
      style={{ maxWidth: 400 }}
    />
  </div>

  <div className="welcome-banner-modern">
    <div className="welcome-content">
      <h2>👋 Hello, {userName}!</h2>
      <p>Let’s check out today’s stats and performance.</p>
    </div>
  </div>
</section>

{/* Statistics Overview */}
<section className="custom-overview">
  <Row gutter={[16, 16]}>
    {[
      {
        title: "Total Cases",
        value: stats.totalProjects || 0,
        color: "#1890ff",
        icon: <FiFileText size={28} />,
      },
      {
        title: "Total Clients",
        value: stats.totalUsers || 0,
        color: "#52c41a",
        icon: <FaUsersCog size={28} />,
      },
      {
        title: "Cases Active",
        value: stats.casesWon || 0,
        color: "#13c2c2",
        icon: <FaUserShield size={28} />,
      },
      {
        title: "Cases Closed",
        value: stats.casesLost || 0,
        color: "#f5222d",
        icon: <FaBalanceScale size={28} />,
      },
    ].map((item, index) => (
      <Col xs={24} sm={12} md={6} key={index}>
        <Card
          className="stat-card"
          bordered={false}
          style={{ borderLeft: `5px solid ${item.color}` }}
        >
          <div className="stat-content">
            <div className="stat-icon" style={{ color: item.color }}>
              {item.icon}
            </div>
            <div className="stat-text">
              <h4>{item.title}</h4>
              <h2>{item.value}</h2>
            </div>
          </div>
        </Card>
      </Col>
    ))}
  </Row>
</section>


    <section className="p-6 space-y-10 bg-gray-50 min-h-screen">
    <div className="bg-gray-100 p-4 rounded-xl shadow-md">
      {/* Toggle button */}
      <div
        className="cursor-pointer bg-white rounded-md shadow px-4 py-3 text-center hover:bg-indigo-100"
        onClick={() => setCalendarOpen(!calendarOpen)}
      >
        <p className="text-lg font-semibold text-indigo-600">📅 Today: {today}</p>
        <p className="text-sm text-gray-600">Tap to open full calendar</p>
      </div>

      {/* Calendar */}
      {calendarOpen && (
        <div className="bg-white shadow-md mt-4 p-4 rounded-md">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            height="auto"
            events={reminders.map(r => ({ title: r.title, date: r.date }))}
            datesSet={handleDatesSet}
          />
        </div>
      )}

      {/* Reminder Form */}
{showForm && (
  <div className="absolute z-50 top-16 left-0 right-0 mx-auto max-w-md bg-white shadow-xl p-4 rounded-md border border-indigo-300">
    <h3 className="text-lg font-semibold text-indigo-700 mb-2">
      ➕ Add Entry for {selectedDate}
    </h3>
    <div className="flex space-x-4 mb-2">
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          value="reminder"
          checked={formType === 'reminder'}
          onChange={() => setFormType('reminder')}
        />
        <span>Reminder</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          value="todo"
          checked={formType === 'todo'}
          onChange={() => setFormType('todo')}
        />
        <span>To-Do</span>
      </label>
    </div>
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Title"
        className="w-full border rounded p-2"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        className="w-full border rounded p-2"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <button
        type="submit"
        className="bg-rgb(74, 30, 79) text-white px-4 py-2 rounded hover:bg-rgb(74, 30, 79)"
      >
        Save
      </button>
    </form>
  </div>
)}


      {/* Upcoming Reminders */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">🔔 Upcoming Reminders</h3>
        {reminders.length === 0 ? (
          <p className="text-gray-500 text-sm">No reminders yet.</p>
        ) : (
          <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
            {reminders
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((reminder) => (
                <li
                  key={reminder.id}
                  onClick={() => setActiveReminder(reminder)}
                  className="bg-white p-3 rounded-md shadow cursor-pointer hover:bg-indigo-50 border-l-4 border-indigo-400"
                >
                  <div className="flex justify-between">
                    <p className="text-indigo-700 font-semibold">{reminder.title}</p>
                    <span className="text-xs text-gray-500">{reminder.date}</span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* Reminder Detail */}
      {activeReminder && (
        <div className="bg-white shadow-md mt-4 p-4 rounded-md border border-indigo-300">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold text-indigo-700">📝 Reminder Details</h4>
            <button
              onClick={() => setActiveReminder(null)}
              className="text-sm text-red-500 hover:underline"
            >
              Close
            </button>
          </div>
          <p><strong>Title:</strong> {activeReminder.title}</p>
          <p><strong>Description:</strong> {activeReminder.description || 'N/A'}</p>
          <p><strong>Date:</strong> {activeReminder.date}</p>
        </div>
      )}
    </div>
           

      {/* Recent Work Orders Table */}
      <section>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">📝 Recent Cases</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="px-4 py-2">Case #</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Court</th>
                <th className="px-4 py-2">Hearing Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCases.map((c, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{c.case_num}</td>
                  <td className="px-4 py-2">{c.case_title}</td>
                  <td className="px-4 py-2">{c.court}</td>
                  <td className="px-4 py-2">
                    {c.date_of_hearing
                      ? new Date(c.date_of_hearing).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
              {recentCases.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No recent cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
    </section>
 {/* Chat Icon */}
<button className="chat-toggle-button" onClick={toggleChat}>
  <FaCommentDots />
</button>

{/* Chat Box */}
{isChatOpen && (
  <div className="chat-box">
    <div className="chat-header">Ask Anything</div>
    <div className="chat-messages">
      {messages.map((msg, index) => (
        <div
        key={index}
        style={{
          textAlign: msg.sender === "user" ? "right" : "left",
          marginBottom: "10px",
          whiteSpace: "pre-wrap",
          fontFamily: msg.sender === "ai" ? "Courier New, monospace" : "inherit",
          backgroundColor: msg.sender === "ai" ? "#f3f4f6" : "transparent",
          padding: msg.sender === "ai" ? "8px" : "0",
          borderRadius: "5px"
        }}
      >
        <strong>{msg.sender === "user" ? "You" : "AI"}:</strong> {msg.text}
      </div>
      
      ))}
    </div>
    <div className="chat-input-area">
      <input
        type="text"
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleTextGuidance()}
        placeholder="Type your question..."
      />
      <button onClick={handleTextGuidance}>Send</button>
    </div>
  </div>
)}



{/* Footer */}
<footer className="home-footer">
  <p>© 2025 <strong>Law Admin Group</strong>. All Rights Reserved.</p>
</footer>
</div>


     
      </div>
    </>
  );
};

export default Home;
