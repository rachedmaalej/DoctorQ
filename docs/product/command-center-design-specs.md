# BleSaf/DoctorQ Admin Command Center: Design Specification

## Introduction

This document outlines the design and components of the administrative command center for the BleSaf (DoctorQ) SaaS platform. The dashboard is designed to provide a comprehensive overview of the platform's performance, with a specific focus on managing the customer lifecycle from free trial to paid subscription. The design is informed by best practices in SaaS dashboard design and the specific business logic of the BleSaf application.

## I. Main Dashboard (Overview)

The main dashboard serves as the command center's landing page, offering a high-level, at-a-glance view of the most critical business and operational metrics. This allows the admin to quickly assess the overall health of the platform.

### Key Performance Indicators (KPIs) at a Glance

A top-level summary of the most important metrics:

| Metric                  | Description                                      | Data Source (from schema) |
| ----------------------- | ------------------------------------------------ | ------------------------- |
| **Active Trials**       | Number of clinics currently in their free trial. | `Clinic` model (filtered) |
| **Paid Subscriptions**  | Number of clinics with active paid subscriptions.| `Clinic` model (filtered) |
| **Monthly Recurring Revenue (MRR)** | Total predictable monthly revenue from paid subscriptions. | Calculated from `Clinic` model |
| **Trial-to-Paid Conversion Rate** | Percentage of trials that convert to paid plans. | Calculated from `Clinic` model |
| **Daily Active Clinics** | Number of unique clinics using the app daily. | `DailyStat` model |

### Onboarding Funnel Summary

A visual representation of the 3-step onboarding process, showing the number of users who have completed each step and the drop-off rate between steps. This provides immediate insight into the effectiveness of the onboarding experience.

*   **Chart Type:** Funnel Chart
*   **Data:**
    *   Step 1 Completions
    *   Step 2 Completions
    *   Step 3 Completions
    *   Conversion Rate at each stage

### Recent Activity Feed

A real-time feed of important events occurring on the platform. This allows the admin to stay informed about recent signups, conversions, and potential issues.

*   **Content:**
    *   New clinic signups (e.g., "Dr. Smith's clinic just started a free trial.")
    *   New paid subscriptions (e.g., "Dr. Jones' clinic has just subscribed.")
    *   Significant clinic activity (e.g., "La Marsa Clinic has processed over 100 patients today.")


## II. Clinic Management

This section provides a detailed view of all clinics on the platform, allowing for efficient management of individual accounts.

### Clinic Directory

A searchable and filterable table of all clinics that have signed up for the platform.

| Column | Description |
| --- | --- |
| **Clinic Name** | The name of the clinic. |
| **Doctor Name** | The primary doctor associated with the clinic. |
| **Email** | The contact email for the clinic. |
| **Subscription Status** | Current status (e.g., `Trial`, `Active`, `Past Due`, `Canceled`). |
| **Trial End Date** | The date the free trial expires. |
| **Sign-up Date** | The date the clinic registered. |
| **Actions** | Quick actions for each clinic. |

### Actions Available

*   **View Details:** Navigate to a detailed view of the clinic.
*   **Extend Trial:** Manually extend the free trial period for a specific clinic.
*   **Upgrade to Paid:** Manually upgrade a trial account to a paid subscription.
*   **Send Message:** Compose and send a direct message to the clinic's contact email.
*   **Deactivate Account:** Temporarily or permanently deactivate a clinic's account.

## III. Financial Analytics

This section provides a comprehensive overview of the platform's financial performance, focusing on revenue, churn, and subscription metrics.

### Key Financial Metrics

A detailed breakdown of important financial indicators:

| Metric | Description |
| --- | --- |
| **Monthly Recurring Revenue (MRR)** | Total monthly revenue from all paid subscriptions. |
| **MRR Growth Rate** | The month-over-month percentage increase in MRR. |
| **Average Revenue Per User (ARPU)** | The average monthly revenue generated per paid clinic. |
| **Customer Lifetime Value (CLTV)** | A prediction of the net profit attributed to the entire future relationship with a customer. |
| **Churn Rate (Revenue)** | The percentage of revenue lost from existing customers in a given period. |

### Revenue Trends

A line chart visualizing revenue over time, with the ability to filter by different periods (e.g., monthly, quarterly, annually).

*   **Chart Type:** Line Chart
*   **Data:**
    *   MRR over time
    *   New MRR from new subscriptions
    *   Expansion MRR from upgrades
    *   Churned MRR from cancellations

### Subscription Status Breakdown

A pie chart showing the distribution of clinics by their subscription status.

*   **Chart Type:** Pie Chart
*   **Data:**
    *   Active Trials
    *   Paid Subscriptions
    *   Past Due
    *   Canceled

## IV. User Onboarding & Engagement

This section focuses on how new users are adopting the platform and how existing users are engaging with the application's core features.

### Onboarding Funnel Analysis

A detailed view of the 3-step onboarding process, allowing for a deeper understanding of user behavior during this critical phase.

*   **Chart Type:** Funnel Chart with step-by-step breakdown
*   **Metrics per Step:**
    *   Number of users starting the step
    *   Number of users completing the step
    *   Completion rate for the step
    *   Average time spent on the step

### Feature Adoption

This area tracks the usage of key features within the DoctorQ application to understand what provides the most value to users.

| Feature | Usage Metric | Description |
| --- | --- | --- |
| **Queue Management** | Patients Processed per Clinic | Average number of patients managed through the queue per day. |
| **Check-in Methods** | Distribution of Check-in Types | A breakdown of how patients are added to the queue (QR Code, Manual, WhatsApp). |
| **Notifications** | SMS/WhatsApp Messages Sent | The volume of notifications being sent from the platform. |
| **Real-time Updates** | Patient Status Page Views | How often patients are checking their real-time position in the queue. |

### User Activity

Metrics that provide insight into the overall activity levels of the clinics on the platform.

*   **Daily/Monthly Active Users (DAU/MAU):** The number of unique clinics using the platform on a daily and monthly basis.
*   **Session Duration:** The average amount of time clinics spend in the application per session.
*   **Key Action Frequency:** How often critical actions (e.g., `Add Patient`, `Call Next Patient`) are performed.

## V. Platform Health & Operations

This section provides visibility into the technical performance and operational status of the BleSaf platform, ensuring a reliable service for the clinics.

### Service Status

Real-time status indicators for the core services of the application.

| Service | Status | Details |
| --- | --- | --- |
| **Frontend Application** | `Operational` / `Degraded` / `Offline` | Monitors the availability of the main web app. |
| **Backend API** | `Operational` / `Degraded` / `Offline` | Monitors the health of the API that powers the application. |
| **Database** | `Connected` / `Disconnected` | Checks the connectivity and performance of the PostgreSQL database. |
| **SMS Gateway (Twilio)** | `Operational` / `Delayed` / `Error` | Tracks the status of the integration with the SMS provider. |

### Resource Usage

Key metrics related to the consumption of third-party services, which have direct cost implications.

*   **SMS Usage:**
    *   Total SMS messages sent (today, this month)
    *   SMS delivery rate
    *   SMS cost forecast
*   **API Usage:**
    *   API request volume
    *   Average API response time
    *   API error rate

### System Logs

A centralized and searchable interface for viewing application and system logs, which is essential for troubleshooting and debugging.

*   **Log Levels:** Filterable by `Info`, `Warning`, `Error`, `Critical`.
*   **Search:** Full-text search across all log entries.
*   **Real-time Tailing:** Ability to view logs as they are generated.

## VI. Conclusion and Recommendations

This admin command center is designed to provide a centralized and actionable view of the BleSaf platform. By focusing on the key metrics related to the customer journey—from trial and onboarding to paid subscription and engagement—the admin can effectively manage the platform, support the clinics, and make data-driven decisions to grow the business.

### Recommendations for Implementation

*   **Prioritize the Main Dashboard and Clinic Management:** These sections are the most critical for day-to-day operations.
*   **Iterate on Analytics:** The Financial and Engagement analytics sections can be built out over time, starting with the most important metrics and adding more detail as the platform grows.
*   **Integrate Alerts:** Implement automated alerts for critical events, such as a spike in the churn rate, a drop in the trial conversion rate, or a service outage.

## VII. References

[1] Thoughtspot. (2025, December 8). *12 key SaaS Metrics And KPIs You Should Track in 2026*. Retrieved from https://www.thoughtspot.com/data-trends/dashboard/saas-metrics-kpis

[2] Amplitude. (2024, March 5). *Top 10 Metrics to Measure Freemium and Free Trial Performance*. Retrieved from https://amplitude.com/blog/freemium-free-trial-metrics
