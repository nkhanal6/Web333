require('dotenv').config();
const Sequelize = require('sequelize');

// Create the Sequelize instance with proper SSL configuration
const sequelize = new Sequelize({
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log // Remove this in production
});

// Define Sector model
const Sector = sequelize.define('Sector', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sector_name: Sequelize.STRING
}, { 
  timestamps: false,
  tableName: 'Sectors' // Make sure this matches your table name exactly
});

// Define Project model
const Project = sequelize.define('Project', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: Sequelize.STRING,
  feature_img_url: Sequelize.STRING,
  summary_short: Sequelize.TEXT,
  intro_short: Sequelize.TEXT,
  impact: Sequelize.TEXT,
  original_source_url: Sequelize.STRING,
  sector_id: {
    type: Sequelize.INTEGER,
    references: {
      model: 'Sectors',
      key: 'id'
    }
  }
}, { 
  timestamps: false,
  tableName: 'Projects' // Make sure this matches your table name exactly
});

// Define association
Project.belongsTo(Sector, { foreignKey: 'sector_id' });
Sector.hasMany(Project, { foreignKey: 'sector_id' });

// Modified initialize function with proper error handling
async function initialize() {
  try {
    // Test the connection first
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully');

    // Sync the models with the database
    await sequelize.sync({ alter: false }); // Don't use force: true in production
    console.log("Models synchronized with database");

    // Check if sectors exist, if not, seed them
    const sectorCount = await Sector.count();
    if (sectorCount === 0) {
      const sectorData = require("../data/sectorData");
      await Sector.bulkCreate(sectorData);
      console.log("Sectors seeded successfully");
    }

    return Promise.resolve();
  } catch (err) {
    console.error("Database initialization error:", err);
    return Promise.reject(err);
  }
}

// Function to add a new project
async function addProject(projectData) {
  try {
    const newProject = await Project.create({
      title: projectData.title,
      intro_short: projectData.intro_short,
      summary_short: projectData.summary_short,
      impact: projectData.impact,
      original_source_url: projectData.original_source_url,
      sector_id: projectData.sector_id,
      feature_img_url: projectData.feature_img_url
    });
    return newProject;
  } catch (err) {
    throw new Error(err.errors ? err.errors[0].message : "Unknown error while adding project.");
  }
}

async function getAllSectors() {
  try {
    const sectors = await Sector.findAll();
    return sectors;
  } catch (err) {
    throw new Error("Error fetching sectors: " + err);
  }
}

async function getAllProjects() {
  try {
    const projects = await Project.findAll({
      include: [Sector]
    });
    return projects;
  } catch (err) {
    throw new Error("Error fetching projects: " + err);
  }
}

async function getProjectById(projectId) {
  try {
    const project = await Project.findOne({
      where: { id: projectId },
      include: [Sector]
    });
    return project;
  } catch (err) {
    throw new Error("Unable to find requested project: " + err);
  }
}

async function getProjectsBySector(sector) {
  try {
    const projects = await Project.findAll({
      include: [Sector],
      where: {
        '$Sector.sector_name$': {
          [Sequelize.Op.iLike]: `%${sector}%`
        }
      }
    });
    return projects;
  } catch (err) {
    throw new Error("Unable to find requested projects: " + err);
  }
}

async function editProject(id, projectData) {
  try {
    const project = await Project.findByPk(id);
    if (project) {
      project.title = projectData.title;
      project.intro_short = projectData.intro_short;
      project.summary_short = projectData.summary_short;
      project.impact = projectData.impact;
      project.original_source_url = projectData.original_source_url;
      project.sector_id = projectData.sector_id;

      await project.save();
      return project;
    } else {
      throw new Error("Project not found");
    }
  } catch (err) {
    throw new Error("Error updating project: " + (err.errors ? err.errors[0].message : err.message));
  }
}

async function deleteProject(id) {
  try {
    const result = await Project.destroy({
      where: { id: id }
    });
    
    if (result === 0) {
      throw new Error("Project not found");
    }
  } catch (err) {
    throw new Error(err.errors ? err.errors[0].message : "Error deleting project");
  }
}

// Export the functions
module.exports = {
  initialize,
  addProject,
  getAllSectors,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  editProject,
  deleteProject,
  Sector,
  Project
};