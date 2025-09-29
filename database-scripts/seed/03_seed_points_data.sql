-- =============================================
-- Points and Rewards Data Seeding Script
-- =============================================
-- Description: Seed achievements, rewards catalog, and sample loyalty program data
-- Dependencies: 02_seed_insurance_data.sql
-- Execution Order: 03
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Default Achievements
-- =============================================
INSERT INTO achievements (
    name, description, category, icon, points_reward, requirements, 
    is_active, sort_order, created_at, updated_at
) VALUES
(
    'Welcome to JustAskShel',
    'Complete your first login to the platform',
    'Milestone',
    'LogIn',
    100,
    '{"action": "login", "count": 1}',
    true,
    1,
    NOW(),
    NOW()
),
(
    'Profile Master',
    'Complete all sections of your profile',
    'Milestone',
    'User',
    250,
    '{"action": "profile_complete", "completion_percentage": 100}',
    true,
    2,
    NOW(),
    NOW()
),
(
    'First Policy',
    'Purchase your first insurance policy',
    'Milestone',
    'Shield',
    500,
    '{"action": "policy_purchase", "count": 1}',
    true,
    3,
    NOW(),
    NOW()
),
(
    'Claims Expert',
    'Submit your first insurance claim',
    'Activity',
    'FileText',
    200,
    '{"action": "claim_submission", "count": 1}',
    true,
    4,
    NOW(),
    NOW()
),
(
    'Week Warrior',
    'Log in for 7 consecutive days',
    'Streak',
    'Calendar',
    300,
    '{"action": "login_streak", "days": 7}',
    true,
    5,
    NOW(),
    NOW()
),
(
    'Social Butterfly',
    'Refer your first friend to the platform',
    'Referral',
    'Users',
    400,
    '{"action": "referral", "count": 1}',
    true,
    6,
    NOW(),
    NOW()
),
(
    'Bronze Champion',
    'Reach Bronze tier status',
    'Tier',
    'Medal',
    0,
    '{"tier": "Bronze", "points_required": 0}',
    true,
    7,
    NOW(),
    NOW()
),
(
    'Silver Achiever',
    'Reach Silver tier status',
    'Tier',
    'Award',
    1000,
    '{"tier": "Silver", "points_required": 500}',
    true,
    8,
    NOW(),
    NOW()
),
(
    'Gold Standard',
    'Reach Gold tier status',
    'Tier',
    'Trophy',
    2000,
    '{"tier": "Gold", "points_required": 2000}',
    true,
    9,
    NOW(),
    NOW()
),
(
    'Platinum Elite',
    'Reach Platinum tier status',
    'Tier',
    'Crown',
    5000,
    '{"tier": "Platinum", "points_required": 5000}',
    true,
    10,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    points_reward = EXCLUDED.points_reward,
    requirements = EXCLUDED.requirements,
    updated_at = NOW();

-- =============================================
-- Rewards Catalog
-- =============================================
INSERT INTO rewards (
    name, description, category, points_cost, value, image_url, 
    available_quantity, is_active, valid_from, terms, created_at, updated_at
) VALUES
(
    '$5 Amazon Gift Card',
    'Redeem your points for a $5 Amazon gift card to shop for anything you need',
    'Gift Card',
    500,
    5.00,
    '/rewards/amazon-gift-card.png',
    1000,
    true,
    NOW(),
    'Gift card will be delivered via email within 24 hours. Valid for 12 months from issue date.',
    NOW(),
    NOW()
),
(
    '$10 Starbucks Gift Card',
    'Enjoy your favorite coffee with a $10 Starbucks gift card',
    'Gift Card',
    1000,
    10.00,
    '/rewards/starbucks-gift-card.png',
    500,
    true,
    NOW(),
    'Gift card will be delivered via email within 24 hours. Valid at participating Starbucks locations.',
    NOW(),
    NOW()
),
(
    '$25 Walmart Gift Card',
    'Shop for groceries, electronics, and more with a $25 Walmart gift card',
    'Gift Card',
    2500,
    25.00,
    '/rewards/walmart-gift-card.png',
    200,
    true,
    NOW(),
    'Gift card will be delivered via email within 24 hours. Valid at Walmart stores and online.',
    NOW(),
    NOW()
),
(
    '10% Premium Discount',
    'Get 10% off your next insurance premium payment',
    'Insurance Credit',
    750,
    NULL,
    '/rewards/premium-discount.png',
    NULL,
    true,
    NOW(),
    'Discount applies to next premium payment only. Cannot be combined with other offers.',
    NOW(),
    NOW()
),
(
    '25% Premium Discount',
    'Get 25% off your next insurance premium payment',
    'Insurance Credit',
    2000,
    NULL,
    '/rewards/premium-discount-25.png',
    NULL,
    true,
    NOW(),
    'Discount applies to next premium payment only. Cannot be combined with other offers.',
    NOW(),
    NOW()
),
(
    'Free Telemedicine Consultation',
    'Get a free 30-minute consultation with a licensed healthcare provider',
    'Premium Service',
    1500,
    75.00,
    '/rewards/telemedicine.png',
    100,
    true,
    NOW(),
    'Must be used within 90 days of redemption. Subject to provider availability.',
    NOW(),
    NOW()
),
(
    'Priority Customer Support',
    'Get priority access to customer support for 3 months',
    'Premium Service',
    800,
    NULL,
    '/rewards/priority-support.png',
    NULL,
    true,
    NOW(),
    'Priority support valid for 3 months from redemption date.',
    NOW(),
    NOW()
),
(
    'JustAskShel T-Shirt',
    'Show your loyalty with an official JustAskShel branded t-shirt',
    'Merchandise',
    1200,
    20.00,
    '/rewards/tshirt.png',
    50,
    true,
    NOW(),
    'Available in sizes S-XXL. Please allow 2-3 weeks for delivery.',
    NOW(),
    NOW()
),
(
    'Insurance Planning Session',
    'Get a free 1-hour insurance planning session with a certified agent',
    'Experience',
    3000,
    150.00,
    '/rewards/planning-session.png',
    25,
    true,
    NOW(),
    'Session must be scheduled within 60 days of redemption. Subject to agent availability.',
    NOW(),
    NOW()
),
(
    '$50 Restaurant Gift Card',
    'Enjoy a nice meal with a $50 gift card to popular restaurant chains',
    'Gift Card',
    5000,
    50.00,
    '/rewards/restaurant-gift-card.png',
    100,
    true,
    NOW(),
    'Choose from participating restaurant partners. Gift card delivered via email.',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    points_cost = EXCLUDED.points_cost,
    value = EXCLUDED.value,
    updated_at = NOW();

-- =============================================
-- Sample Seasonal Campaign
-- =============================================
INSERT INTO seasonal_campaigns (
    name, description, campaign_type, points_multiplier, bonus_points,
    is_active, auto_start, auto_end, start_date, end_date,
    target_user_tiers, target_categories, max_participants,
    conditions, created_at, updated_at
) VALUES
(
    'Holiday Bonus 2025',
    'Earn double points on all activities during the holiday season!',
    'Holiday',
    2.00,
    100,
    true,
    false,
    true,
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    ARRAY['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    ARRAY['Login', 'Policy Purchase', 'Referral'],
    NULL,
    '{"holiday_theme": "winter", "special_rewards": true}',
    NOW(),
    NOW()
),
(
    'New Year Resolution Challenge',
    'Complete health-focused activities for bonus points in January',
    'Special Event',
    1.50,
    250,
    false,
    true,
    true,
    NOW() + INTERVAL '60 days',
    NOW() + INTERVAL '90 days',
    ARRAY['Bronze', 'Silver', 'Gold'],
    ARRAY['Profile Complete', 'Newsletter'],
    500,
    '{"theme": "health", "challenge_based": true}',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    points_multiplier = EXCLUDED.points_multiplier,
    bonus_points = EXCLUDED.bonus_points,
    updated_at = NOW();

-- =============================================
-- Sample Seasonal Achievements
-- =============================================
WITH campaign_data AS (
    SELECT id as holiday_campaign_id 
    FROM seasonal_campaigns 
    WHERE name = 'Holiday Bonus 2025' 
    LIMIT 1
)
INSERT INTO seasonal_achievements (
    campaign_id, name, description, icon, category, points_reward,
    requirements, is_active, max_awards, created_at, updated_at
)
SELECT 
    c.holiday_campaign_id,
    'Holiday Spirit',
    'Log in every day during the holiday campaign',
    'Gift',
    'Holiday',
    500,
    '{"login_streak": 7, "during_campaign": true}',
    true,
    NULL,
    NOW(),
    NOW()
FROM campaign_data c
UNION ALL
SELECT 
    c.holiday_campaign_id,
    'Holiday Shopper',
    'Purchase a new policy during the holiday season',
    'ShoppingBag',
    'Holiday',
    1000,
    '{"policy_purchase": 1, "during_campaign": true}',
    true,
    NULL,
    NOW(),
    NOW()
FROM campaign_data c
ON CONFLICT DO NOTHING;

-- =============================================
-- Sample Recommendation Models
-- =============================================
INSERT INTO recommendation_models (
    name, version, model_type, description, parameters,
    performance_metrics, is_active, training_data_size, accuracy_score,
    created_at, deployed_at
) VALUES
(
    'Content-Based Recommender',
    'v1.0',
    'Content-Based',
    'Recommends rewards based on user preferences and reward characteristics',
    '{"similarity_threshold": 0.7, "max_recommendations": 10}',
    '{"precision": 0.75, "recall": 0.68, "f1_score": 0.71}',
    true,
    1000,
    0.750,
    NOW(),
    NOW()
),
(
    'Collaborative Filter',
    'v1.1',
    'Collaborative',
    'Recommends rewards based on similar user behavior patterns',
    '{"neighbors": 50, "min_ratings": 5}',
    '{"precision": 0.78, "recall": 0.72, "f1_score": 0.75}',
    false,
    2500,
    0.780,
    NOW(),
    NULL
)
ON CONFLICT (name, version) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    accuracy_score = EXCLUDED.accuracy_score;

COMMIT;

-- Output confirmation
SELECT 'Points and rewards data seeding completed successfully.' as status,
       (SELECT COUNT(*) FROM achievements) as achievements_created,
       (SELECT COUNT(*) FROM rewards) as rewards_created,
       (SELECT COUNT(*) FROM seasonal_campaigns) as campaigns_created;