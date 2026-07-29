class HistoryError(Exception):
    """Base error raised by the file history engine."""


class HistoryNotFoundError(HistoryError):
    """The requested file has no active history."""


class HistoryNodeNotFoundError(HistoryError):
    """The requested revision does not exist in the file history."""


class UnsupportedHistoryFileError(HistoryError):
    """The file type is not managed by the history engine."""


class HistoryCorruptedError(HistoryError):
    """A persisted history object is invalid or damaged."""
