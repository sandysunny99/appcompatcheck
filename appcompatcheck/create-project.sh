#!/bin/bash
# AppCompatCheck Project Creation Script
echo "🚀 Creating AppCompatCheck project structure..."

# Main app directory structure
mkdir -p app/{api,admin,reports,upload,docs,invite,'(login)'}
mkdir -p app/api/{auth,scans,organizations,users,reports,notifications,admin,integrations}
mkdir -p app/api/auth/{login,register,logout,refresh,profile,forgot-password,reset-password,verify-email}
mkdir -p app/api/scans/{create,status,results,history,export,cancel,retry,templates}
mkdir -p app/api/organizations/{create,update,members,invites,settings,billing,usage}
mkdir -p app/api/users/{profile,settings,preferences,activity,notifications}
mkdir -p app/api/reports/{generate,export,templates,scheduling,analytics}
mkdir -p app/api/notifications/{send,history,preferences,templates}
mkdir -p app/api/admin/{users,organizations,scans,system,analytics,monitoring}
mkdir -p app/api/integrations/{github,gitlab,bitbucket,jira,slack,teams,webhook}

# Components structure
mkdir -p components/{ui,dashboard,scans,admin,reports,monitoring,organizations}
mkdir -p components/ui/{button,input,card,table,modal,dropdown,tabs,toast,loading,progress}
mkdir -p components/dashboard/{overview,stats,charts,activity,quick-actions}
mkdir -p components/scans/{scan-form,scan-list,scan-details,scan-results,scan-history}
mkdir -p components/admin/{user-management,org-management,system-monitoring,analytics}
mkdir -p components/reports/{report-builder,report-viewer,report-export,report-scheduler}
mkdir -p components/monitoring/{metrics,alerts,logs,performance}
mkdir -p components/organizations/{org-settings,member-management,billing,usage}

# Library structure
mkdir -p lib/{auth,db,scanning,notifications,integrations,monitoring,'data-management','file-processing',utils,websocket,reports,security,performance,'multi-tenancy',redis,api,compatibility,upload,logging}
mkdir -p lib/auth/{jwt,rbac,sessions,oauth,ldap}
mkdir -p lib/db/{models,migrations,seeds,queries,transactions}
mkdir -p lib/scanning/{engines,parsers,analyzers,reporters,queue}
mkdir -p lib/notifications/{email,sms,push,in-app,templates}
mkdir -p lib/integrations/{github,gitlab,bitbucket,jira,slack,teams,webhook}
mkdir -p lib/monitoring/{metrics,logging,tracing,alerting}
mkdir -p lib/utils/{validation,encryption,compression,file-handling,date-time}

# Tests structure
mkdir -p tests/{unit,integration,e2e,performance,fixtures,mocks,helpers}
mkdir -p tests/unit/{components,lib,api,utils}
mkdir -p tests/integration/{auth,scanning,notifications,database}
mkdir -p tests/e2e/{user-flows,admin-flows,organization-flows,scan-flows}
mkdir -p tests/performance/{load,stress,spike,volume}

# Configuration and deployment
mkdir -p config/{environments,secrets,certificates,logging}
mkdir -p docker/{development,production,testing,monitoring}
mkdir -p k8s/{base,overlays,monitoring,ingress,storage}
mkdir -p k8s/base/{app,database,redis,nginx,monitoring}
mkdir -p k8s/overlays/{development,staging,production}
mkdir -p monitoring/{prometheus,grafana,alertmanager,loki,jaeger}
mkdir -p scripts/{deployment,maintenance,backup,monitoring,testing}

# Documentation structure
mkdir -p docs/{api,architecture,deployment,user-guide,developer-guide}
mkdir -p docs/api/{authentication,scanning,organizations,reports,integrations}
mkdir -p docs/architecture/{overview,database,security,scalability,monitoring}

# Static assets
mkdir -p public/{images,icons,fonts,docs,samples}
mkdir -p public/images/{logos,screenshots,diagrams,illustrations}

# Styles
mkdir -p styles/{components,pages,themes,utilities}

# Additional directories
mkdir -p .github/{workflows,templates,issues}
mkdir -p database/{migrations,seeds,schemas,backups}
mkdir -p logs/{application,access,error,audit}
mkdir -p uploads/{scans,reports,exports,temp}

echo "✅ Project structure created successfully!"
echo "📁 Total directories created: $(find . -type d | wc -l)"