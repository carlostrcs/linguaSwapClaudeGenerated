using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Xunit;

namespace LinguaSwap.Tests;

public class LeitnerServiceTests
{
    private readonly LeitnerService _leitner = new();
    private static readonly DateTime Now = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);

    private static LearningState NewState(int box = 1) => new()
    {
        SourceLanguage = "es",
        TargetLanguage = "en",
        BoxLevel = box,
    };

    [Fact]
    public void CorrectAnswer_PromotesBox_AndSchedulesNextReview()
    {
        var state = NewState(box: 1);

        _leitner.ApplyAnswer(state, correct: true, Now);

        Assert.Equal(2, state.BoxLevel);
        Assert.Equal(1, state.CorrectCount);
        Assert.Equal(1, state.Streak);
        Assert.Equal(Now, state.LastReviewedAt);
        Assert.Equal(Now + _leitner.IntervalForBox(2), state.NextReviewAt);
    }

    [Fact]
    public void WrongAnswer_ResetsToBoxOne_AndZeroesStreak()
    {
        var state = NewState(box: 4);
        state.Streak = 5;

        _leitner.ApplyAnswer(state, correct: false, Now);

        Assert.Equal(1, state.BoxLevel);
        Assert.Equal(0, state.Streak);
        Assert.Equal(1, state.IncorrectCount);
        Assert.Equal(Now + _leitner.IntervalForBox(1), state.NextReviewAt);
    }

    [Fact]
    public void CorrectAnswer_AtMaxBox_StaysCapped()
    {
        var state = NewState(box: LeitnerService.MaxBox);

        _leitner.ApplyAnswer(state, correct: true, Now);

        Assert.Equal(LeitnerService.MaxBox, state.BoxLevel);
        Assert.True(_leitner.IsMastered(state));
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(2, 2)]
    [InlineData(3, 4)]
    [InlineData(4, 8)]
    [InlineData(5, 16)]
    public void IntervalForBox_GrowsWithBox(int box, int expectedDays)
    {
        Assert.Equal(TimeSpan.FromDays(expectedDays), _leitner.IntervalForBox(box));
    }

    [Fact]
    public void IsMastered_OnlyAtMaxBox()
    {
        Assert.False(_leitner.IsMastered(NewState(box: LeitnerService.MaxBox - 1)));
        Assert.True(_leitner.IsMastered(NewState(box: LeitnerService.MaxBox)));
    }
}
