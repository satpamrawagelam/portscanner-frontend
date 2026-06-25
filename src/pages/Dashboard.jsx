import React from "react";
import { LayoutDashboard } from "lucide-react";
import DashboardOverview from "./DashboardOverview";
import DashboardSeverity from "./DashboardSeverity";
import DashboardTrend from "./DashboardTrend";
import DashboardBranchHealth from "./DashboardBranchHealth";

export default function Dashboard() {
    return (
        <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center gap-2 mb-4">
                <div className="bg-primary bg-opacity-10 p-2 rounded">
                    <LayoutDashboard size={24} className="text-primary" />
                </div>
                <div>
                    <h3 className="fw-bold text-dark mb-0">Dashboard Overview</h3>
                    <p className="text-muted mb-0 small">Real-time network security status monitoring.</p>
                </div>
            </div>

            <DashboardOverview hideTitle={true} />
            <DashboardTrend hideTitle={true} />
            <DashboardSeverity hideTitle={true} />
            <DashboardBranchHealth hideTitle={true} />
        </div>
    );
}