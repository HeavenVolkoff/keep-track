import NavBar from './components/nav-bar.js'
import DateHR from './components/hour-hr.js'
import PanArea from './components/pan-area.js'
import WorkdayTimeline from './components/workday-timeline.js'
import defineCustomElements from './behaviour/define.js'

// Initialize custom elements
defineCustomElements(NavBar, DateHR, WorkdayTimeline, PanArea)
