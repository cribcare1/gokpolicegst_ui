//import { parse } from "cookie";

class ApiService {
// Utility function to fetch token from cookies
static  getToken = () => {
  if (typeof window !== "undefined") { // Ensure client-side execution
    return localStorage.getItem("token");
  }
  return null;
};

// **1️⃣ GET Request Handler**
static async handleGetRequest(url, timeoutMs = 4000) {
  console.log("GET Call URL:", url);

  try {
    if (typeof window === "undefined") {
      throw new Error("Cannot access localStorage on the server");
    }

    const token = localStorage.getItem("token");
    console.log("User Token:", token);

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Add timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, { 
      method: "GET", 
      headers,
      signal: controller.signal 
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {}; // Prevents JSON parsing error

    console.log("Response Data:", data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("GET Request timeout after", timeoutMs, "ms");
      return { error: "Request timeout", timeout: true };
    }
    console.error("GET Request Failed:", error);
    return { error: "GET Request Failed" };
  }
}

// **2️⃣ POST Request Handler**
static  async  handlePostRequest(url, req, res) {
    console.log("Post method");
    console.log("Post url : ${url}"+url);
    
    // if (!url) return res.status(400).json({ error: "URL parameter is required" });
    console.log("Stored Token:", localStorage.getItem("token"));
   const token = localStorage.getItem("token");
    console.log("User Token:", token);
    console.log("Request Body:", req);
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(req),
      });
      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }
      //const data = await response.json();
      //console.log("Response Data:", data);
      const text = await response.text();
      const data = text ? JSON.parse(text) : {}; // Prevents JSON parsing error
  
      console.log("Response Data:", data);
      return data;
    } catch (error) {
      console.error("POST Request Failed:", error);
      return res.status(500).json({ error: "POST Request Failed" });
    }
  }
  

// **3️⃣ DELETE Request Handler**
static  async  handleDeleteRequest(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL parameter is required" });

  try {
    const response = await fetch(url, { method: "DELETE" });
    return res.status(response.status).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE Request Failed:", error);
    return res.status(500).json({ error: "DELETE Request Failed" });
  }
}

static async handlePostMultiPartFileRequest(url, req, file) {
  console.log("URLs::::", url);
  console.log("Request Body::::", req);
  console.log("File::::", file);

  if (!url) {
    console.error("Please provide a URL!");
    return;
  }
  if (!file || !(file instanceof File || file instanceof Blob)) {
    console.error("Invalid file! Please select a valid file.");
    return;
  }
  if (typeof window === "undefined") {
    throw new Error("Cannot access localStorage on the server");
  }

  const token = localStorage.getItem("userToken");
  console.log("User Token:", token);

  // Set headers but DO NOT include 'Content-Type' (browser will set it)
  // const headers = { Accept: "application/json" };
  // if (token) headers.Authorization = `Bearer ${token}`;

  // console.log("Headers:", headers);

  // Create FormData
  const formData = new FormData();
  formData.append("formData", JSON.stringify(req)); // 🔥 Backend expects raw JSON string
  formData.append("zipFile", file); // Append file (PDF)

  // Debug FormData content
  for (let pair of formData.entries()) {
    console.log(pair[0] + ":", pair[1]);
  }

  try {
    // setIsUploading(true);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,  // Ensure token is sent properly
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Upload Successful!", result);
    return result;
  } catch (error) {
    console.error("Upload failed:", error.message);
    alert("Upload failed! See console for details.");
  } finally {
    // setIsUploading(false);
  }
}
// static async handlePostDownloadZipRequest(url, requestData) {
//   try {
//     console.log("Post method");
//     console.log("Post url:", url);

//     const token = localStorage.getItem("userToken");
//     console.log("User Token:", token);
//     console.log("Request Body:", requestData);

//     const headers = {
//       "Content-Type": "application/json",
//       Accept: "application/zip", // 👈 Change to expect ZIP
//     };

//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//     }

//     const response = await fetch(url, {
//       method: "POST",
//       headers,
//       body: JSON.stringify(requestData),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to fetch file");
//     }

//     const blob = await response.blob();
//     if (blob.size === 0) {
//       throw new Error("Empty file received");
//     }

//     // ✅ Try to extract filename from Content-Disposition header
//     const contentDisposition = response.headers.get("Content-Disposition");
//     let filename = "Form16.zip"; // Default fallback

//     if (contentDisposition && contentDisposition.includes("filename=")) {
//       const match = contentDisposition.match(/filename="?([^"]+)"?/);
//       if (match && match[1]) {
//         filename = match[1];
//       }
//     }

//     // ✅ Trigger download
//     const blobUrl = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = blobUrl;
//     a.download = filename;
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     window.URL.revokeObjectURL(blobUrl);
//    return response;
//   } catch (error) {
//     console.error("POST Request Failed:", error);
//     alert("Download failed.");
//   }
// }
static async handlePostDownloadZipRequest(url, requestData, fileType = "pdf") {
  try {
    const token = localStorage.getItem("userToken");
    console.log("request body::"+JSON.stringify(requestData));
    console.log("fileType ::"+fileType) 
    const headers = {
      "Content-Type": "application/json",
      Accept: fileType === "zip" ? "application/zip" : "application/pdf",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch file");
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("Empty file received");
    }

    // ✅ Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = fileType === "zip" ? "Form16.zip" : fileType+".pdf"; // fallback

    if (contentDisposition && contentDisposition.includes("filename=")) {
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n\r]+)["']?/i);
      console.log(match+"  match=========== "+match[1]);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    // ✅ Trigger browser download
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);

    return response;
  } catch (error) {
    console.error("Download failed:", error);
    alert("Download failed.");
  }
}

}
export default ApiService;
