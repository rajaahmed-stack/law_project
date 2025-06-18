import React, { useState, useEffect } from "react";
import axios from "axios";
import { Switch } from "antd";
import * as XLSX from "xlsx";
import "../styles/management.css";

const departments = [
  "Cases Details",
  "Civil Court",
  "High Court",
  "Supreme Court",
  "Special/ Tribunal",
  
];

const baseColumns = [
  { header: "Case ID", accessor: "case_num" },
  { header: "Case Title", accessor: "case_title" },
  { header: "Court", accessor: "court" },
  { header: "Date of Hearing", accessor: "date_of_hearing" },
  { header: "Register Date", accessor: "case_register_date" },
  { header: "Judge", accessor: "current_judge" },
  { header: "Nature of Case", accessor: "nature_of_case" },
  { header: "Representing", accessor: "representing" },
  { header: "Stage & Status", accessor: "stage_and_status" },
  { header: "File in Possession", accessor: "file_in_possession" },
  { header: "File Description", accessor: "file_description" },
  { header: "Client Name", accessor: "client_name" },
  { header: "Client Phone", accessor: "client_phone" },
  { header: "Client Address", accessor: "client_address" },
  { header: "Client CNIC", accessor: "client_cnic" },
  { header: "Created At", accessor: "create_at" }
];

const departmentColumns = {
  "Cases Details": baseColumns,
  "Civil Court": baseColumns,
  "High Court": baseColumns,
  "Supreme Court": baseColumns,
  "Special/ Tribunal": baseColumns,
};
const getColumns = (selectedDept) => {
  return Array.isArray(departmentColumns[selectedDept]) ? departmentColumns[selectedDept] : [];
};



const Management = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    axios
      .get("https://lawproject-production.up.railway.app/api/management/management-data")
      .then((response) => {
        setData(response.data);
        // Automatically select and filter "Work Receiving" department
        handleDepartmentFilter("Cases Details");
      })
      .catch((error) => {
        console.error("Error fetching management data:", error);
      });
  }, []);
  

  const handleSearch = () => {
    if (searchTerm.trim() === "") {
      setSearchResult(data);
    } else {
      axios
        .get(`https://lawproject-production.up.railway.app/api/management/search-workorder/${searchTerm}`)
        .then((response) => setSearchResult(response.data))
        .catch((error) => console.error("Search error:", error));
    }
  };

  const handleDepartmentFilter = (dept) => {
    setSelectedDept(dept);
    axios
      .get(`https://lawproject-production.up.railway.app/api/management/search-filter?value=${encodeURIComponent(dept)}`)
      .then((response) => setSearchResult(response.data))
      .catch((error) => console.error("Department filter error:", error));
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(searchResult);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Management Data");
    XLSX.writeFile(workbook, "management_data.xlsx");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  const [rowBeingEdited, setRowBeingEdited] = useState(null);
const [editedRowData, setEditedRowData] = useState({});

const handleEditCase = (row) => {
  setRowBeingEdited(row.case_num); // Start editing this row
  setEditedRowData({ ...row }); // Clone row data into editable state
};

const handleInputChange = (field, value) => {
  setEditedRowData((prev) => ({ ...prev, [field]: value }));
};

const handleSaveCase = () => {
  const {
    case_title, court, date_of_hearing, case_register_date,
    current_judge, nature_of_case, representing, stage_and_status,
    file_in_possession, file_description, client_name,
    client_phone, client_address, client_cnic, file_path // include file here
  } = editedRowData;

  if (!case_title || !court || !date_of_hearing) {
    alert("Some required fields are missing.");
    return;
  }

  const formatDate = (input) => {
    if (!input) return "";
    const date = new Date(input);
    return date.toISOString().slice(0, 10);
  };

  // Create FormData to support file upload
  const formData = new FormData();
  formData.append("case_title", case_title);
  formData.append("court", court);
  formData.append("date_of_hearing", formatDate(date_of_hearing));
  formData.append("case_register_date", formatDate(case_register_date));
  formData.append("current_judge", current_judge);
  formData.append("nature_of_case", nature_of_case);
  formData.append("representing", representing);
  formData.append("stage_and_status", stage_and_status);
  formData.append("file_in_possession", file_in_possession);
  formData.append("file_description", file_description);
  formData.append("client_name", client_name);
  formData.append("client_phone", client_phone);
  formData.append("client_address", client_address);
  formData.append("client_cnic", client_cnic);

  // Append file only if new file is selected
  if (file_path instanceof File) {
    formData.append("file_path", file_path);
  }

  axios
    .put(
      `https://lawproject-production.up.railway.app/api/management/edit-case/${rowBeingEdited}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    .then(() => {
      alert("Case updated successfully");
      handleDepartmentFilter("Cases Details");
      setRowBeingEdited(null);
      setEditedRowData({});
    })
    .catch((error) => {
      console.error("Update error:", error);
      alert("Failed to update case");
    });
};



  return (
    <div className="management-container">

      {/* --- Header --- */}
      <header className="home-header">
        <div>
          <h1>🏗️ Law Firm Group</h1>
          <p>“Building the Future with Excellence”</p>
        </div>
        <div className="mode-switch">
          <span>{darkMode ? "🌙" : "☀️"}</span>
          <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        </div>
      </header>

      <h1>Law Firm Dashboard</h1>

      {/* --- Search Section --- */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Enter Title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* --- Department Dropdown --- */}
      <div className="dropdown-container">
        <button className="dropdown-button" onClick={toggleDropdown}>
          Court ▼
        </button>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            {departments.map((dept, index) => (
              <button
                key={index}
                onClick={() => {
                  handleDepartmentFilter(dept);
                  setIsDropdownOpen(false);
                }}
                className={`dropdown-item ${selectedDept === dept ? "active" : ""}`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- Table --- */}
      {getColumns(selectedDept).length > 0 && (
<div className="table-scroll-wrapper">
  <table className="management-table">
          <thead>
      <tr>
        {getColumns(selectedDept).map((col) => (
          <th key={col.accessor}>{col.header}</th>
        ))}
        <th>Actions</th> {/* Add Actions column */}
      </tr>
    </thead>
   <tbody>
  {searchResult.map((row, index) => (
    <tr
      key={index}
     onDoubleClick={() => {
      console.log("Trying to open:", row.file_path);  // 🔍 Debug log
      if (row.file_path && typeof row.file_path === 'string') {
        window.open(row.file_path.url, "_blank");
      } else {
        alert("No file available for this row or file path is invalid.");
      }
    }}

      style={{ cursor: row.file_path ? "pointer" : "default" }}
    >
      {getColumns(selectedDept).map((col) => (
        <td key={col.accessor}>
          {rowBeingEdited === row.case_num ? (
  <>
    <input
      type="text"
      value={editedRowData[col.accessor] || ""}
      onChange={(e) => handleInputChange(col.accessor, e.target.value)}
      style={{ width: "120px" }}
    />
    {col.accessor === "file_path" && (
      <input
        type="file"
        multiple
        onChange={(e) => handleInputChange("file_path", e.target.files)}
        style={{ marginTop: "5px" }}
      />
    )}
  </>
) : (
  (() => {
    const cellValue = row[col.accessor];
    if (cellValue === null || cellValue === undefined) return '';
    if (typeof cellValue === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(cellValue)) {
      return new Date(cellValue).toISOString().slice(0, 10);
    }
    if (typeof cellValue === 'object') return JSON.stringify(cellValue);
    return cellValue;
  })()
)}
        </td>
      ))}
      <td>
        {rowBeingEdited === row.case_num ? (
          <button className="save-button" onClick={handleSaveCase}>
            💾 Save
          </button>
        ) : (
          <button className="edit-button" onClick={() => handleEditCase(row)}>
            ✏️ Edit
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>
  </table>
  </div>
)}

      {/* --- Download Button --- */}
      <button className="download-button" onClick={downloadExcel}>
        Download as Excel
      </button>
    </div>
  );
};

export default Management;
