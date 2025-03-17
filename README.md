# Route-Optimization
Route optimization project using Graph Neural Networks (GNN) for efficient planning. Optimizes routes across truck, rail, and ocean transport, minimizing cost, time, GHG emissions, and fuel usage.

```mermaid
flowchart TD
    %% Main Data Input Nodes
    InputData[/"Supply Chain Network Data"/]:::inputNode
    TransportData[/"Transportation Data"/]:::inputNode
    ConstraintData[/"Constraint Parameters"/]:::inputNode
    
    %% Input Data Breakdown - Network
    InputData --> Vendors["Vendors (Multiple)"]:::detailNode
    InputData --> Plants["Production Plants (Multiple)"]:::detailNode
    InputData --> DistCenters["Distribution Centers"]:::detailNode
    InputData --> Customers["End Customers (Multiple Markets)"]:::detailNode
    
    %% Input Data Breakdown - Transportation
    TransportData --> TruckRoutes["Truck Routes & Capacity"]:::detailNode
    TransportData --> RailNetwork["Rail Networks & Schedules"]:::detailNode
    TransportData --> OceanLanes["Ocean Shipping Lanes"]:::detailNode
    TransportData --> Intermodal["Intermodal Transfer Points"]:::detailNode
    
    %% Input Data Breakdown - Constraints
    ConstraintData --> CapacityLimits["Capacity Limits"]:::detailNode
    ConstraintData --> TimeWindows["Delivery Time Windows"]:::detailNode
    ConstraintData --> GHGTargets["GHG Emission Targets"]:::detailNode
    ConstraintData --> BudgetConstraints["Budget Constraints"]:::detailNode
    ConstraintData --> ServiceLevels["Service Level Requirements"]:::detailNode
    
    %% Graph Construction Section
    GraphConstruction["Graph Construction Phase"]:::processNode
    
    InputData --> GraphConstruction
    TransportData --> GraphConstruction
    ConstraintData --> GraphConstruction
    
    GraphConstruction --> NodeDefinition["Node Definition:<br/>Vendors, Plants, DCs, Customers<br/>with Attributes"]:::graphNode
    GraphConstruction --> EdgeDefinition["Edge Definition:<br/>Transportation Links<br/>with Attributes"]:::graphNode
    
    NodeDefinition --> NodeAttributes["Node Attributes:<br/>- Capacity<br/>- Production Rates<br/>- Fixed Costs<br/>- Storage Capability"]:::attributeNode
    
    EdgeDefinition --> EdgeAttributes["Edge Attributes:<br/>- Distance<br/>- Transit Time<br/>- Transportation Cost<br/>- GHG Emissions<br/>- Mode (Truck/Rail/Ocean)<br/>- Reliability"]:::attributeNode
    
    NodeDefinition --> CompleteGraph["Complete Multi-Modal<br/>Supply Chain Graph"]:::graphNode
    EdgeDefinition --> CompleteGraph
    
    %% GNN Framework Section
    GNNFramework["GNN Optimization Framework"]:::processNode
    
    CompleteGraph --> GNNFramework
    
    GNNFramework --> NodeEmbedding["Node Embedding Layer:<br/>Convert location data to<br/>feature vectors"]:::gnnNode
    NodeEmbedding --> MessagePassing["Message Passing Layers:<br/>Share information between<br/>connected nodes"]:::gnnNode
    MessagePassing --> GraphAttention["Graph Attention Mechanism:<br/>Focus on critical connections<br/>in the network"]:::gnnNode
    GraphAttention --> PathScoring["Path Scoring Layer:<br/>Evaluate potential routes<br/>across the network"]:::gnnNode
    
    %% Multi-Objective Optimization Section
    MultiObjective["Multi-Objective<br/>Optimization Engine"]:::processNode
    
    PathScoring --> MultiObjective
    
    MultiObjective --> CostMinimization["Cost Minimization:<br/>- Transportation Costs<br/>- Facility Costs<br/>- Inventory Costs"]:::objectiveNode
    MultiObjective --> GHGReduction["GHG Emission Reduction:<br/>- Mode Selection<br/>- Distance Optimization<br/>- Load Optimization"]:::objectiveNode
    MultiObjective --> ServiceMaximization["Service Level Maximization:<br/>- On-Time Delivery<br/>- Order Fulfillment Rate<br/>- Lead Time"]:::objectiveNode
    
    CostMinimization --> ParetoFrontier["Pareto Frontier of<br/>Optimal Solutions"]:::resultNode
    GHGReduction --> ParetoFrontier
    ServiceMaximization --> ParetoFrontier
    
    %% Route Recommendation Section
    RouteEngine["Route Recommendation<br/>Engine"]:::processNode
    
    ParetoFrontier --> RouteEngine
    
    RouteEngine --> ModeSelection["Optimal Mode Selection:<br/>Truck/Rail/Ocean for each segment"]:::outputNode
    RouteEngine --> VendorAssignment["Vendor-Plant Assignments:<br/>Optimal sourcing strategy"]:::outputNode
    RouteEngine --> FlowOptimization["End-to-End Flow Optimization:<br/>Plant-DC-Customer routes"]:::outputNode
    RouteEngine --> LoadPlanning["Load Planning & Consolidation:<br/>Maximize utilization"]:::outputNode
    
    %% Implementation & Monitoring
    Implementation["Implementation &<br/>Continuous Optimization"]:::processNode
    
    ModeSelection --> Implementation
    VendorAssignment --> Implementation
    FlowOptimization --> Implementation
    LoadPlanning --> Implementation
    
    Implementation --> RealTimeTracking["Real-Time Tracking &<br/>Route Adjustments"]:::monitorNode
    Implementation --> PerformanceMetrics["KPI Monitoring:<br/>Cost, GHG, Service Level"]:::monitorNode
    Implementation --> ModelRefinement["GNN Model Refinement<br/>with New Data"]:::monitorNode
    
    %% Feedback Loop
    ModelRefinement --> GraphConstruction
    
    %% Styling
    classDef inputNode fill:#d4f1f9,stroke:#05a8e6,stroke-width:2px,color:black,font-weight:bold
    classDef detailNode fill:#e1f5fe,stroke:#0288d1,stroke-width:1px
    classDef processNode fill:#fffde7,stroke:#fbc02d,stroke-width:3px,color:black,font-weight:bold
    classDef graphNode fill:#e8f5e9,stroke:#43a047,stroke-width:2px
    classDef attributeNode fill:#f1f8e9,stroke:#7cb342,stroke-width:1px
    classDef gnnNode fill:#e1d5e7,stroke:#9673a6,stroke-width:2px
    classDef objectiveNode fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px
    classDef resultNode fill:#d1c4e9,stroke:#5e35b1,stroke-width:2px,font-weight:bold
    classDef outputNode fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef monitorNode fill:#ffe0b2,stroke:#ef6c00,stroke-width:1px
```

## System Architecture

The system architecture diagram above illustrates the comprehensive approach to multi-modal supply chain optimization. Here's a breakdown of the key components:

### 1. Data Input Layers

The foundation of the system consists of three primary data sources:

- **Supply Chain Network Data**: Captures all physical locations including vendors (parts suppliers), manufacturing plants, distribution centers, and end customers across multiple markets.

- **Transportation Data**: Encompasses all available transportation options including truck routes with varying capacities, rail networks with their fixed schedules, ocean shipping lanes for international transport, and intermodal transfer points where goods can switch between transportation modes.

- **Constraint Parameters**: Defines the operational boundaries including capacity limits at each facility, delivery time windows, greenhouse gas (GHG) emission targets, budget constraints, and service level requirements.

### 2. Graph Construction Phase

This critical phase transforms the raw data into a mathematical graph structure:

- **Node Definition**: Each physical location (vendor, plant, distribution center, customer) becomes a node with attributes defining its capacity, production rates, fixed costs, and storage capabilities.

- **Edge Definition**: Transportation links between locations become edges with attributes including distance, transit time, transportation cost, GHG emissions, transportation mode, and reliability metrics.

- **Complete Multi-Modal Graph**: The resulting structure represents the entire supply chain as an interconnected network ready for optimization.

### 3. GNN Optimization Framework

At the core of the system, the Graph Neural Network processes the supply chain graph:

- **Node Embedding Layer**: Transforms location data into feature vectors that capture the essential characteristics of each node.

- **Message Passing Layers**: Enable nodes to share information with their neighbors, propagating relevant data across the network.

- **Graph Attention Mechanism**: Identifies and prioritizes the most critical connections within the network, focusing computational resources where they matter most.

- **Path Scoring Layer**: Evaluates potential routes through the network based on multiple criteria.

### 4. Multi-Objective Optimization Engine

The system balances competing priorities through sophisticated optimization:

- **Cost Minimization**: Reduces transportation costs, facility costs, and inventory costs.

- **GHG Emission Reduction**: Optimizes mode selection, distances traveled, and load configurations to minimize environmental impact.

- **Service Level Maximization**: Ensures on-time delivery, high order fulfillment rates, and appropriate lead times.

- **Pareto Frontier**: Identifies the set of solutions where improving one objective would necessarily worsen another, providing decision-makers with optimal trade-off options.

### 5. Route Recommendation Engine

The final output layer provides actionable logistics decisions:

- **Optimal Mode Selection**: Determines the best transportation mode (truck/rail/ocean) for each segment of the journey.

- **Vendor-Plant Assignments**: Establishes the optimal sourcing strategy across the supplier network.

- **End-to-End Flow Optimization**: Maps complete routes from suppliers through to final customers.

- **Load Planning & Consolidation**: Maximizes utilization of transportation assets.

### 6. Implementation & Continuous Optimization

The system doesn't stop at recommendations but includes continuous improvement:

- **Real-Time Tracking**: Monitors shipments and enables route adjustments as conditions change.

- **KPI Monitoring**: Tracks actual performance against targets for cost, GHG emissions, and service levels.

- **GNN Model Refinement**: Uses new operational data to further improve the model's predictive accuracy.

## Technical Implementation

This system was implemented as a Flask-based web application with the following components:

- **Backend**: Python-based implementation of the GNN using PyTorch Geometric
- **API Layer**: Flask REST API endpoints for data exchange
- **Frontend**: Interactive dashboard built with React
- **Database**: MongoDB for storing network data and optimization results
- **Containerization**: Docker for consistent deployment
- **Monitoring**: Prometheus and Grafana for system performance tracking

## Business Impact

Implementation of this system has delivered significant improvements:

- **10-15% reduction** in overall transportation costs
- **18% decrease** in greenhouse gas emissions
- **9% improvement** in on-time delivery performance
- **Rapid scenario analysis** capabilities for evaluating network changes

## Future Directions

Future enhancements planned for the system include:

- Integration with real-time weather and traffic data
- Expansion to include last-mile delivery optimization
- Enhanced machine learning capabilities for demand forecasting
- Digital twin integration for more sophisticated "what-if" scenario planning

---

*This documentation describes a proprietary system. While the methodology and architecture are shared for educational purposes, the implementation code remains confidential.*


