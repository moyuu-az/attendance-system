"""
JST (Japan Standard Time) timezone utility functions for the attendance management system.

This module provides utilities for handling timezone conversions and getting 
current JST time to ensure consistent time handling across the application.
"""

import pytz
from datetime import datetime, date, time
from typing import Optional

# Japan Standard Time timezone
JST = pytz.timezone('Asia/Tokyo')


def now_jst() -> datetime:
    """
    Get current datetime in JST timezone.
    
    Returns:
        datetime: Current datetime in JST timezone
    """
    return datetime.now(JST)


def today_jst() -> date:
    """
    Get current date in JST timezone.
    
    Returns:
        date: Current date in JST timezone
    """
    return now_jst().date()


def now_time_jst() -> time:
    """
    Get current time in JST timezone.
    
    Returns:
        time: Current time in JST timezone
    """
    return now_jst().time()


def to_jst(dt: datetime) -> datetime:
    """
    Convert datetime to JST timezone.
    
    Args:
        dt: Datetime object to convert
        
    Returns:
        datetime: Datetime converted to JST timezone
    """
    if dt.tzinfo is None:
        # If naive datetime, assume it's UTC
        dt = pytz.UTC.localize(dt)
    return dt.astimezone(JST)


def localize_jst(dt: datetime) -> datetime:
    """
    Localize naive datetime as JST.
    
    Args:
        dt: Naive datetime object
        
    Returns:
        datetime: Datetime localized to JST timezone
    """
    if dt.tzinfo is not None:
        raise ValueError("Datetime object is already timezone-aware")
    return JST.localize(dt)


def combine_date_time_jst(date_obj: date, time_obj: Optional[time] = None) -> datetime:
    """
    Combine date and time objects and localize to JST.
    
    Args:
        date_obj: Date object
        time_obj: Time object (if None, uses current JST time)
        
    Returns:
        datetime: Combined datetime localized to JST
    """
    if time_obj is None:
        time_obj = now_time_jst()
    
    # If time object has timezone info, remove it and use JST
    if hasattr(time_obj, 'tzinfo') and time_obj.tzinfo is not None:
        time_obj = time_obj.replace(tzinfo=None)
    
    naive_dt = datetime.combine(date_obj, time_obj)
    return JST.localize(naive_dt)


def format_jst_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S %Z") -> str:
    """
    Format datetime in JST timezone.
    
    Args:
        dt: Datetime object
        format_str: Format string for datetime formatting
        
    Returns:
        str: Formatted datetime string in JST
    """
    jst_dt = to_jst(dt) if dt.tzinfo is not None else localize_jst(dt)
    return jst_dt.strftime(format_str)


def is_same_day_jst(dt1: datetime, dt2: datetime) -> bool:
    """
    Check if two datetimes are on the same day in JST.
    
    Args:
        dt1: First datetime
        dt2: Second datetime
        
    Returns:
        bool: True if both datetimes are on the same JST day
    """
    jst_dt1 = to_jst(dt1) if dt1.tzinfo is not None else localize_jst(dt1)
    jst_dt2 = to_jst(dt2) if dt2.tzinfo is not None else localize_jst(dt2)
    return jst_dt1.date() == jst_dt2.date()


def get_jst_start_of_day(date_obj: Optional[date] = None) -> datetime:
    """
    Get start of day (00:00:00) in JST for given date.
    
    Args:
        date_obj: Date object (if None, uses current JST date)
        
    Returns:
        datetime: Start of day in JST
    """
    if date_obj is None:
        date_obj = today_jst()
    return JST.localize(datetime.combine(date_obj, time.min))


def get_jst_end_of_day(date_obj: Optional[date] = None) -> datetime:
    """
    Get end of day (23:59:59.999999) in JST for given date.
    
    Args:
        date_obj: Date object (if None, uses current JST date)
        
    Returns:
        datetime: End of day in JST
    """
    if date_obj is None:
        date_obj = today_jst()
    return JST.localize(datetime.combine(date_obj, time.max))