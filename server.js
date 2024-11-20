const express = require('express');
const app = express();
const projectModule = require("./modules/projects");
const HTTP_PORT = process.env.PORT || 8080;

// Load environment variables
require('dotenv').config();

const requiredEnvVars = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGPORT'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
    process.exit(1);
  }
});

// Serve static files (e.g., CSS, JS)
app.use(express.static(__dirname + '/public'));

// Set views and template engine (EJS)
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Middleware to handle form data
app.use(express.urlencoded({ extended: true }));

// Routes for the application
app.get('/', (req, res) => {
  res.render("home");
});

app.get('/about', (req, res) => {
  res.render("about");
});

// Route to view all projects or filter by sector
app.get("/solutions/projects", async (req, res) => {
  try {
    if (req.query.sector) {
      // Handle filtering by sector
      let projects = await projectModule.getProjectsBySector(req.query.sector);
      if (projects.length > 0) {
        res.render("projects", { projects: projects });
      } else {
        res.status(404).render("404", { message: `No projects found for sector: ${req.query.sector}` });
      }
    } else {
      // If no sector is specified, show all projects
      let projects = await projectModule.getAllProjects();
      res.render("projects", { projects: projects });
    }
  } catch (err) {
    // Handle error and display 500 page if something goes wrong
    console.error(err);
    res.render("500", { message: `Error fetching projects: ${err.message}` });
  }
});

// Route to view a specific project by ID
app.get("/solutions/projects/:id", async (req, res) => {
  try {
    let project = await projectModule.getProjectById(req.params.id);
    if (project) {
      res.render("project", { project: project });
    } else {
      res.status(404).render("404", { message: "Project not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(404).render("404", { message: "Project not found: " + err.message });
  }
});

// Route to render the Add Project form
app.get("/solutions/addProject", async (req, res) => {
  try {
    // Fetch sectors to populate the sector dropdown
    const sectors = await projectModule.getAllSectors();
    res.render("addProject", { sectors: sectors, page: '/solutions/addProject' });
  } catch (err) {
    console.error(err);
    res.render("500", { message: `Error: ${err.message}` });
  }
});

// Route to handle the form submission and add a new project
app.post("/solutions/addProject", async (req, res) => {
  try {
    // Pass form data to addProject function
    await projectModule.addProject(req.body);
    res.redirect("/solutions/projects");
  } catch (err) {
    console.error(err);
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err.message}` });
  }
});

// Route to render the Edit Project form
app.get("/solutions/editProject/:id", async (req, res) => {
  try {
    // Fetch the specific project by ID
    const project = await projectModule.getProjectById(req.params.id);
    // Fetch all sectors for the select dropdown
    const sectors = await projectModule.getAllSectors();
    
    if (project) {
      res.render("editProject", { 
        sectors: sectors, 
        project: project, 
        page: '' 
      });
    } else {
      res.status(404).render("404", { message: "Project not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(404).render("404", { message: err.message || "Error fetching project or sectors" });
  }
});

// Route to handle the form submission and update an existing project
app.post("/solutions/editProject", async (req, res) => {
  try {
    const { id, title, feature_img_url, intro_short, summary_short, impact, original_source_url, sector_id } = req.body;
    const projectData = {
      title, feature_img_url, intro_short, summary_short, impact, original_source_url, sector_id
    };
    
    // Call the editProject function from the projects module
    await projectModule.editProject(id, projectData);
    res.redirect("/solutions/projects");
  } catch (err) {
    console.error(err);
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err.message}` });
  }
});

// Route to delete a project
app.get("/solutions/deleteProject/:id", async (req, res) => {
  try {
    await projectModule.deleteProject(req.params.id);
    res.redirect("/solutions/projects");
  } catch (err) {
    console.error(err);
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err.message}` });
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
});

// Initialize the database and start the server
projectModule.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => { 
      console.log(`Server listening on: ${HTTP_PORT}`); 
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  });



// const express = require('express');
// const app = express();
// const projectData = require("./modules/projects");
// const HTTP_PORT = process.env.PORT || 8080;

// app.use(express.static(__dirname + '/public'));
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');
// app.use(express.urlencoded({ extended: true }));  

// app.get('/', (req, res) => {
//   res.render("home");
// });

// app.get('/about', (req, res) => {
//   res.render("about");
// });

// app.get("/solutions/projects", async (req, res) => {
//   try {
//     if (req.query.sector) {
//       let projects = await projectData.getProjectsBySector(req.query.sector);
//       (projects.length > 0) ? res.render("projects", { projects: projects }) : res.status(404).render("404", { message: `No projects found for sector: ${req.query.sector}` });
//     } else {
//       let projects = await projectData.getAllProjects();
//       res.render("projects", { projects: projects });
//     }
//   } catch (err) {
//     res.status(404).render("404", { message: err });
//   }
// });

// app.get("/solutions/projects/:id", async (req, res) => {
//   try {
//     let project = await projectData.getProjectById(req.params.id);
//     res.render("project", { project: project });
//   } catch (err) {
//     res.status(404).render("404", { message: err });
//   }
// });

// app.get("/solutions/addProject", async (req, res) => {
//   try {
//     const sectors = await projectData.getAllSectors();
//     res.render("addProject", { sectors: sectors });
//   } catch (err) {
//     res.status(500).render("500", { message: `Error: ${err}` });
//   }
// });

// app.post("/solutions/addProject", async (req, res) => {
//   try {
//     await projectData.addProject(req.body);  
//     res.redirect("/solutions/projects");
//   } catch (err) {
//     res.status(500).render("500", { message: `Error: ${err}` });
//   }
// });

// app.get("/solutions/editProject/:id", async (req, res) => {
//   try {
//     const sectors = await projectData.getAllSectors();
//     const project = await projectData.getProjectById(req.params.id);
//     res.render("editProject", { sectors: sectors, project: project });
//   } catch (err) {
//     res.status(404).render("404", { message: `Error: ${err}` });
//   }
// });

// app.post("/solutions/editProject", async (req, res) => {
//   try {
//     await projectData.editProject(req.body.id, req.body);  
//     res.redirect("/solutions/projects");
//   } catch (err) {
//     res.status(500).render("500", { message: `Error: ${err}` });
//   }
// });

// app.get("/solutions/deleteProject/:id", async (req, res) => {
//   try {
//     await projectData.deleteProject(req.params.id);  
//     res.redirect("/solutions/projects");
//   } catch (err) {
//     res.status(500).render("500", { message: `Error: ${err}` });
//   }
// });


// app.use((req, res, next) => {
//   res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
// });

// projectData.initialize().then(() => {
//   app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`); });
// });
