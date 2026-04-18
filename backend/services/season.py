from datetime import datetime

# --------------------------------------------------
# REGION → HEMISPHERE MAP
# --------------------------------------------------

SOUTHERN_HEMISPHERE_REGIONS = [
    "Argentina", "Australia", "Angola", "Bolivia", "Botswana", "Brazil", "Chile", 
    "Comoros", "Democratic Republic of the Congo", "Republic of the Congo", "Ecuador", 
    "Eswatini", "Indonesia", "Kenya", "Kiribati", "Lesotho", "Madagascar", "Malawi", 
    "Mozambique", "Namibia", "Nauru", "New Zealand", "Papua New Guinea", "Paraguay", 
    "Peru", "Rwanda", "São Tomé and Príncipe", "Seychelles", "Solomon Islands", "South Africa", 
    "Tanzania", "Timor-Leste", "Tuvalu", "Uganda", "Uruguay", "Zambia", "Zimbabwe"
]

NORTHERN_HEMISPHERE_REGIONS = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Antigua and Barbuda", "Armenia", 
    "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", 
    "Belize", "Benin", "Bhutan", "Bosnia and Herzegovina", "Brunei", "Bulgaria", "Burkina Faso", 
    "Burundi", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "China", "Colombia", 
    "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", 
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
    "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", 
    "Honduras", "Hungary", "Iceland", "India", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", 
    "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Liberia", "Libya", "Liechtenstein", "Lithuania", 
    "Luxembourg", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", 
    "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Myanmar", "Nepal", "Netherlands", "Nicaragua", 
    "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Philippines", 
    "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
    "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Korea", 
    "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Thailand", "Togo", "Tonga", 
    "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", 
    "Uzbekistan", "Vatican City", "Venezuela", "Vietnam", "Yemen"
]

# --------------------------------------------------
# SEASON DETECTION CORE
# --------------------------------------------------

def detect_season(month: int, hemisphere: str) -> str:
    """
    Global agricultural season logic
    """

    if hemisphere == "south":
        # Southern Hemisphere
        if month in [11, 12, 1, 2]:
            return "Kharif"
        elif month in [3, 4, 5, 6]:
            return "Rabi"
        else:
            return "Zaid"

    # Default → Northern Hemisphere
    if month in [6, 7, 8, 9]:
        return "Kharif"
    elif month in [10, 11, 12, 1, 2]:
        return "Rabi"
    else:
        return "Zaid"


# --------------------------------------------------
# AUTO DETECTION (USED BY BACKEND)
# --------------------------------------------------

def detect_season_auto(region: str) -> str:
    """
    Detect season using region (GPS / user profile)
    Works globally.
    """

    region = region.lower()
    current_month = datetime.now().month

    hemisphere = "north"
    for r in SOUTHERN_HEMISPHERE_REGIONS:
        if r in region:
            hemisphere = "south"
            break

    return detect_season(current_month, hemisphere)
