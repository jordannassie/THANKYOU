export const mockUser = {
  id: "user_001",
  name: "Thank You.",
  email: "user@thankyou.app",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  joinedDate: "January 2025",
};

export const mockMembership = {
  plan: "Premium",
  price: "$99/mo",
  status: "active",
  nextBillingDate: "September 15, 2026",
  features: [
    "Personal Vision Board",
    "Daily Thank You Streak",
    "Dream Declaration",
    "Private Notes",
    "Community",
    "Weekly Zoom Calls",
  ],
};

export const mockStreak = {
  days: 47,
  currentWeek: [true, true, true, true, true, false, false],
  weekLabels: ["M", "T", "W", "T", "F", "S", "S"],
};

export const mockZoomCall = {
  title: "Weekly Accountability Call",
  days: 2,
  hours: 18,
  minutes: 34,
  seconds: 27,
  link: "#",
  description: "Weekly accountability. Stronger together.",
};

export const mockVisionImages = [
  {
    id: "vi_001",
    url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
    alt: "Dream house with pool",
    category: "Home",
  },
  {
    id: "vi_002",
    url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop",
    alt: "Luxury vehicle",
    category: "Vehicle",
  },
  {
    id: "vi_003",
    url: "https://images.unsplash.com/photo-1439130490301-25e322d88054?w=400&h=300&fit=crop",
    alt: "Tropical paradise",
    category: "Travel",
  },
  {
    id: "vi_004",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    alt: "Fitness and health",
    category: "Health",
  },
  {
    id: "vi_005",
    url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop",
    alt: "City skyline success",
    category: "Success",
  },
  {
    id: "vi_006",
    url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop",
    alt: "Private jet travel",
    category: "Travel",
  },
  {
    id: "vi_007",
    url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop",
    alt: "Premium workspace",
    category: "Business",
  },
  {
    id: "vi_008",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    alt: "Mountain landscape",
    category: "Adventure",
  },
  {
    id: "vi_009",
    url: "https://images.unsplash.com/photo-1609220136736-443140cfeaa8?w=400&h=300&fit=crop",
    alt: "Happy family",
    category: "Family",
  },
  {
    id: "vi_010",
    url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
    alt: "Holy Bible",
    category: "Faith",
  },
];

export const mockDreamDeclaration = "Thank you God I will be a billionaire";

export interface Note {
  id: string;
  date: string;
  dateLabel: string;
  grateful: string[];
  prayer: string[];
  action: string[];
  declaration: string;
  scripture: string;
}

export const mockNotes: Note[] = [
  {
    id: "note_001",
    date: "May 18, 2026",
    dateLabel: "Today",
    grateful: [
      "Waking up healthy and strong.",
      "The love and support of my family.",
      "New opportunities and doors God is opening.",
      "Provision, protection, and peace.",
    ],
    prayer: [
      "Wisdom and guidance in every decision.",
      "Financial breakthrough and continued provision.",
      "Boldness to walk in my purpose and help others.",
      "My family's health, unity, and future.",
    ],
    action: [
      "Staying consistent with my prayer and Bible time.",
      "Working on my business and serving my clients well.",
      "Investing in my health through training and nutrition.",
      "Learning something new that moves me forward.",
    ],
    declaration:
      "I believe God is working behind the scenes. My future is bright. I walk by faith, not by sight.",
    scripture:
      '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future." — Jeremiah 29:11',
  },
  {
    id: "note_002",
    date: "May 17, 2026",
    dateLabel: "Yesterday",
    grateful: [
      "A productive and focused day.",
      "Clarity on my next business steps.",
      "Good health and energy.",
      "My mentors and the wisdom they share.",
    ],
    prayer: [
      "Greater faith when things feel uncertain.",
      "Protection over my family.",
      "Divine connections and partnerships.",
      "Peace in the process.",
    ],
    action: [
      "Reading and studying for one hour.",
      "Following through on my commitments.",
      "Reaching out to three potential clients.",
      "Spending quality time with my family.",
    ],
    declaration:
      "God has already made provision for everything I need. I trust His timing and His plan.",
    scripture:
      '"Trust in the Lord with all your heart and lean not on your own understanding." — Proverbs 3:5',
  },
  {
    id: "note_003",
    date: "May 16, 2026",
    dateLabel: "Friday",
    grateful: [
      "The gift of another week.",
      "Progress on my goals, even when it was slow.",
      "Rest, renewal, and preparation for what's ahead.",
      "God's faithfulness that never runs out.",
    ],
    prayer: [
      "A refreshed spirit going into the weekend.",
      "Continued momentum and motivation.",
      "Strength to say no to distractions.",
      "Joy in the journey, not just the destination.",
    ],
    action: [
      "Reviewing my weekly progress.",
      "Planning next week's priorities.",
      "Worshipping and spending time in prayer.",
      "Disconnecting from screens and being present.",
    ],
    declaration:
      "I am becoming who God created me to be. Every step forward, no matter how small, is progress.",
    scripture:
      '"And let us not grow weary of doing good, for in due season we will reap, if we do not give up." — Galatians 6:9',
  },
  {
    id: "note_004",
    date: "May 15, 2026",
    dateLabel: "Thursday",
    grateful: [
      "A new contract signed this week.",
      "My health and physical strength.",
      "Community and people who believe in me.",
      "Clarity in my vision.",
    ],
    prayer: [
      "Favor in my business dealings.",
      "Wisdom to steward resources well.",
      "Open doors that no man can shut.",
      "Continued unity in my household.",
    ],
    action: [
      "Completing the project milestone on time.",
      "Making time for physical training.",
      "Praying with my family.",
      "Journaling my gratitude before bed.",
    ],
    declaration:
      "What God has promised, He is faithful to perform. I choose to believe even when I cannot see.",
    scripture:
      '"For we walk by faith, not by sight." — 2 Corinthians 5:7',
  },
  {
    id: "note_005",
    date: "May 14, 2026",
    dateLabel: "Wednesday",
    grateful: [
      "A clear and focused mind.",
      "Opportunities to serve and add value.",
      "The vision God has placed in my heart.",
      "Small wins that build into big victories.",
    ],
    prayer: [
      "Courage to step out in faith.",
      "Financial provision and abundance.",
      "Peace that surpasses understanding.",
      "Boldness in sharing my faith.",
    ],
    action: [
      "Acting on the ideas God gave me.",
      "Connecting with someone who needed encouragement.",
      "Reviewing my vision board and declaration.",
      "Being disciplined with my time.",
    ],
    declaration:
      "I am not moved by what I see. I am moved by what God has promised. My future is already secured.",
    scripture:
      '"Now faith is confidence in what we hope for and assurance about what we do not see." — Hebrews 11:1',
  },
];

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
  likes: number;
  comments: CommunityComment[];
  liked: boolean;
}

export interface CommunityComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  date: string;
}

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: "post_001",
    author: "Michael R.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    date: "2 hours ago",
    content:
      "Thank you God for another door opening this week. I've been believing for this opportunity for months. His timing is always perfect. Stay faithful — your breakthrough is coming.",
    likes: 24,
    liked: false,
    comments: [
      {
        id: "c_001",
        author: "James T.",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        content: "This is exactly what I needed to hear today. God is good!",
        date: "1 hour ago",
      },
    ],
  },
  {
    id: "post_002",
    author: "Sarah M.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    date: "5 hours ago",
    content:
      "Day 30 of my streak. I never thought I would be consistent with anything like this, but this community has kept me accountable. Thank you all. God is doing something big.",
    likes: 41,
    liked: false,
    comments: [
      {
        id: "c_002",
        author: "Marcus L.",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
        content: "30 days! That is incredible. Keep going.",
        date: "4 hours ago",
      },
      {
        id: "c_003",
        author: "Priya K.",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        content: "You inspire me every day. Proud of you!",
        date: "3 hours ago",
      },
    ],
  },
  {
    id: "post_003",
    author: "David O.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    date: "1 day ago",
    content:
      "The dream declaration feature changed how I start every morning. Speaking your future out loud, with gratitude, is one of the most powerful things you can do. Thank you God for the business breakthrough this month.",
    likes: 67,
    liked: true,
    comments: [],
  },
  {
    id: "post_004",
    author: "Nia W.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face",
    date: "2 days ago",
    content:
      "Just got off the weekly Zoom call. The accountability in this community is different. These are people who actually believe and actually show up. That kind of energy is rare. Grateful.",
    likes: 33,
    liked: false,
    comments: [
      {
        id: "c_004",
        author: "Kevin A.",
        avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face",
        content: "The calls are so good. See you on the next one!",
        date: "2 days ago",
      },
    ],
  },
  {
    id: "post_005",
    author: "James T.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    date: "3 days ago",
    content:
      "Putting my vision board together today. Seeing it all laid out in front of me was emotional. God placed these things in my heart for a reason. I believe I will see every single one of them come to pass.",
    likes: 88,
    liked: false,
    comments: [
      {
        id: "c_005",
        author: "Sarah M.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
        content: "Every. Single. One. Believe it!",
        date: "3 days ago",
      },
      {
        id: "c_006",
        author: "David O.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        content: "This gave me chills. Document the journey, brother.",
        date: "2 days ago",
      },
    ],
  },
  {
    id: "post_006",
    author: "Priya K.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    date: "4 days ago",
    content:
      "Thank you God for health, for family, for provision, for purpose. I used to take these things for granted. Practicing daily gratitude has completely shifted my perspective. Abundance is already here.",
    likes: 52,
    liked: false,
    comments: [],
  },
];

export const mockPreferences = {
  emailNotifications: true,
  weeklyCallReminders: true,
  dailyThankYouReminder: true,
};
